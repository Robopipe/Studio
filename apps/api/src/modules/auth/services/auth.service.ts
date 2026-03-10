import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Organization, PreAuthToken, SessionJwt, Token, UpdateUserRequest } from '@repo/schema';
import { OrgMemberRoleEnum } from '@repo/schema';
import { compare, hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { AppConfig } from 'src/core/configuration/app.config';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { EmailService } from 'src/modules/email/email.service';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { OrganizationMemberRepository } from 'src/repository/services/organization-member-repository.service';
import { OrganizationRepository } from 'src/repository/services/organization-repository.service';
import { PasswordResetRepository } from 'src/repository/services/password-reset-repository.service';
import { UserRepository } from 'src/repository/services/user-repository.service';
import { RegisterDto } from "../dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfig,
  ) {}

  /**
   * Validate email + password, returning the user if correct.
   * @param email - user email
   * @param password - plaintext password
   * @returns the user entity, or null if credentials are invalid
   */
  public async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.db.query.userTable.findFirst({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.checkPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...rest } = user;
    return new UserEntity(rest);
  }

  /**
   * First step of login — issues a short-lived pre-auth token (no org context).
   * @param user - authenticated user entity
   * @returns pre-auth token with user data
   */
  public preAuthLogin(user: UserEntity): PreAuthToken {
    const accessToken = this.jwtService.sign(
      { sub: user.id, scope: 'pre-auth' },
      { expiresIn: 10 * 60 }, // 10 minutes for org selection
    );

    return { accessToken, user: user.toDto() };
  }

  /**
   * Second step — user picks an org and we issue the real session JWT.
   * @param userId - ID of the authenticated user
   * @param organizationId - chosen organization
   * @param res - express response for setting the refresh cookie
   * @returns full session token
   * @throws {UnauthorizedException} if user is not a member of the organization
   * @throws {NotFoundException} if organization doesn't exist
   */
  public async selectOrganization(userId: number, organizationId: number, res: Response): Promise<Token> {
    const membership = await this.organizationMemberRepository.getByUserAndOrg(userId, organizationId);
    if (!membership) {
      throw new UnauthorizedException('You are not a member of this organization');
    }

    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const org = await this.organizationRepository.getById(organizationId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.issueSessionToken(user, org.id, membership.role as OrgMemberRoleEnum, org.toDto(), res);
  }

  /**
   * Switch to a different org without re-entering credentials.
   * @param userId - ID of the authenticated user
   * @param organizationId - target organization
   * @param res - express response for setting the refresh cookie
   * @returns full session token for the new org
   * @throws {UnauthorizedException} if user is not a member of the organization
   */
  public async switchOrganization(userId: number, organizationId: number, res: Response): Promise<Token> {
    return this.selectOrganization(userId, organizationId, res);
  }

  /**
   * Get all orgs the user belongs to, with their role in each.
   * @param userId - ID of the user
   * @returns list of organizations with the user's role
   */
  public async listUserOrganizations(userId: number) {
    const memberships = await this.organizationMemberRepository.getAllByUserId(userId);

    return memberships
      .filter((m) => m.organizationName)
      .map((m) => ({
        id: m.organizationId,
        name: m.organizationName!,
        role: m.role as OrgMemberRoleEnum,
      }));
  }

  /**
   * Create an org and assign the user as owner.
   * @param userId - ID of the user creating the org
   * @param name - organization name
   * @returns the created org with the owner role
   */
  public async createOrganization(userId: number, name: string) {
    const org = await this.organizationRepository.create({ name });

    await this.organizationMemberRepository.create({
      userId,
      organizationId: org.id,
      role: OrgMemberRoleEnum.OWNER,
    });

    return { id: org.id, name: org.name, role: OrgMemberRoleEnum.OWNER };
  }

  /**
   * Refresh an existing session — re-validates membership and reissues the token.
   * @param refreshToken - signed refresh token from cookie
   * @param res - express response for setting the new refresh cookie
   * @returns refreshed session token
   * @throws {UnauthorizedException} if the token is invalid, user no longer exists, or membership was revoked
   */
  public async refreshLogin(refreshToken: string, res: Response): Promise<Token> {
    let payload: SessionJwt;
    try {
      payload = this.jwtService.verify<SessionJwt>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.getById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (payload.orgId && payload.role) {
      const org = await this.organizationRepository.getById(payload.orgId);
      if (!org) {
        throw new UnauthorizedException('Organization not found');
      }

      const membership = await this.organizationMemberRepository.getByUserAndOrg(user.id, payload.orgId);
      if (!membership) {
        throw new UnauthorizedException('No longer a member of this organization');
      }

      return this.issueSessionToken(user, org.id, membership.role as OrgMemberRoleEnum, org.toDto(), res);
    }

    throw new UnauthorizedException('Session expired, please log in again');
  }

  /**
   * Clear the refresh token cookie on logout.
   * @param res - express response
   */
  public logout(res: Response): void {
    this.setRefreshTokenCookie(res, '', 0);
  }

  /**
   * Register a new user with a random password and send a welcome email
   * with a set-password link. The user must set their password before logging in.
   * @param data - registration payload (email, fullName)
   * @returns success message
   * @throws {ConflictException} if a user with that email already exists
   */
  public async register(data: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.userRepository.getByEmail(data.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const randomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await this.hashPassword(randomPassword);
    const user = await this.userRepository.create({
      email: data.email,
      username: data.email,
      fullName: data.fullName,
      password: hashedPassword,
    });

    await this.sendSetPasswordEmail(user);

    return { message: "Account created. Please check your email to set your password." };
  }

  /**
   * Generates a password reset token and sends the welcome/set-password email.
   * @param user - newly created user entity
   */
  private async sendSetPasswordEmail(user: UserEntity): Promise<void> {
    await this.passwordResetRepository.deleteByUserId(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    const setPasswordLink = `${this.configService.webHost}/reset-password?token=${token}&welcome=1`;
    await this.emailService.sendWelcomeEmail(user.email, user.fullName, setPasswordLink);
  }

  /**
   * Send a password reset email if the user exists. Silently no-ops otherwise.
   * @param email - email address to send the reset link to
   */
  public async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) return;

    await this.passwordResetRepository.deleteByUserId(user.id);

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    const resetLink = `${this.configService.webHost}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(email, resetLink);
  }

  /**
   * Reset a user's password using a valid reset token.
   * @param token - the reset token from the email link
   * @param newPassword - new plaintext password
   * @throws {UnauthorizedException} if the token is invalid or expired
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await this.passwordResetRepository.findValidToken(token);
    if (!resetRecord) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.userRepository.updatePassword(resetRecord.userId, hashedPassword);
    await this.passwordResetRepository.markUsed(resetRecord.id);
  }

  /**
   * Update user profile fields.
   * @param id - user ID
   * @param data - fields to update
   * @returns updated user entity
   * @throws {NotFoundException} if user doesn't exist
   */
  public async updateProfile(id: number, data: UpdateUserRequest): Promise<UserEntity> {
    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.update(id, data);
  }

  private issueSessionToken(
    user: UserEntity,
    orgId: number,
    role: OrgMemberRoleEnum,
    orgDto: Organization,
    res: Response,
  ): Token {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      orgId,
      role,
      scope: 'session',
    });

    const refreshTokenDuration = this.configService.jwtRefreshTokenDuration ?? 7 * 24 * 60 * 60;
    const refreshToken = this.jwtService.sign(
      { sub: user.id, orgId, role, scope: 'session' },
      { expiresIn: refreshTokenDuration },
    );

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenDuration * 1000);

    return {
      accessToken,
      user: user.toDto(),
      organization: orgDto,
      role,
    };
  }

  private setRefreshTokenCookie(res: Response, token: string, maxAge: number) {
    const apiHost = new URL(this.configService.apiHost).hostname;
    const webHost = this.configService.webHost
      ? new URL(this.configService.webHost).hostname
      : null;
    const domain = webHost && apiHost.includes(webHost) ? webHost : apiHost;

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.configService.env !== 'local',
      signed: true,
      sameSite: 'strict',
      domain,
      maxAge,
    });
  }

  private checkPassword(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }

  private hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }
}
