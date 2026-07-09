import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { EmailVerificationRepository } from 'src/repository/services/email-verification-repository.service';
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
    private readonly emailVerificationRepository: EmailVerificationRepository,
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

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Please verify your email before logging in.');
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
      .filter((m) => m.organizationName && !m.organizationDeletedAt)
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
   * If the org was deleted or the membership was revoked, fails soft by returning a pre-auth token
   * instead of throwing, so the user's browser silently drops to org-selection rather than logging out.
   * @param refreshToken - signed refresh token from cookie
   * @param res - express response for setting the new refresh cookie
   * @returns refreshed session token, or pre-auth token when org/membership is gone
   * @throws {UnauthorizedException} if the token is invalid or user no longer exists
   */
  public async refreshLogin(refreshToken: string, res: Response): Promise<Token | PreAuthToken> {
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
      const membership = org
        ? await this.organizationMemberRepository.getByUserAndOrg(user.id, payload.orgId)
        : null;

      if (org && membership) {
        return this.issueSessionToken(user, org.id, membership.role as OrgMemberRoleEnum, org.toDto(), res);
      }

      // Org deleted or membership revoked — drop to pre-auth so the user lands on org-selection
      this.setRefreshTokenCookie(res, '', 0);
      return this.preAuthLogin(user);
    }

    this.setRefreshTokenCookie(res, '', 0);
    return this.preAuthLogin(user);
  }

  /**
   * Issues a pre-auth token after the user's org has been deleted and clears the refresh cookie.
   * @param userId - ID of the user who performed the deletion
   * @param res - express response for clearing the refresh cookie
   * @returns pre-auth token
   */
  public async issuePreAuthAfterOrgDeletion(userId: number, res: Response): Promise<PreAuthToken> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    this.setRefreshTokenCookie(res, '', 0);
    return this.preAuthLogin(user);
  }

  /**
   * Clear the refresh token cookie on logout.
   * @param res - express response
   */
  public logout(res: Response): void {
    this.setRefreshTokenCookie(res, '', 0);
  }

  /**
   * Register a new user with a password and send a verification email.
   * If an unverified account exists with that email, updates it and re-sends verification.
   * @param data - registration payload (email, fullName, password)
   * @returns success message
   * @throws {ConflictException} if a verified user with that email already exists
   */
  public async register(data: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.userRepository.getByEmail(data.email);

    if (existingUser) {
      if (existingUser.emailVerifiedAt) {
        throw new ConflictException("User with this email already exists");
      }
      // Unverified account: update credentials to the latest attempt and re-issue verification
      const hashedPassword = await this.hashPassword(data.password);
      await this.userRepository.updatePasswordAndName(existingUser.id, hashedPassword, data.fullName);
      await this.issueEmailVerification(existingUser);
      return { message: "Account created. Please check your email to verify your address." };
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.userRepository.create({
      email: data.email,
      username: data.email,
      fullName: data.fullName,
      password: hashedPassword,
    });

    await this.issueEmailVerification(user);

    return { message: "Account created. Please check your email to verify your address." };
  }

  /**
   * Verify an email address using a token from the verification email.
   * Idempotent: re-verifying an already-verified account is a no-op.
   * @param token - the verification token from the email link
   * @throws {BadRequestException} if the token is invalid or expired
   */
  public async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.emailVerificationRepository.findValidToken(token);
    if (!record) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await this.userRepository.markEmailVerified(record.userId);
    await this.emailVerificationRepository.markUsed(record.id);

    return { message: 'Email verified successfully.' };
  }

  /**
   * Resend a verification email if the account exists and is unverified.
   * Always returns a generic message to avoid user enumeration.
   * @param email - email address to resend the verification link to
   */
  public async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.getByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.issueEmailVerification(user);
    }
    return { message: 'If an account with that email exists and is unverified, a new verification link has been sent.' };
  }

  /**
   * Issues a new email verification token and sends the verification email.
   * Deletes any existing tokens for the user first (single active token).
   * @param user - user to verify
   */
  private async issueEmailVerification(user: UserEntity): Promise<void> {
    await this.emailVerificationRepository.deleteByUserId(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.emailVerificationRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    const verifyLink = `${this.configService.webHost}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail(user.email, verifyLink);
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
   * Change the password of an authenticated user after verifying the current one.
   * @param userId - user ID
   * @param currentPassword - current plaintext password
   * @param newPassword - new plaintext password
   * @throws {NotFoundException} if user doesn't exist
   * @throws {BadRequestException} if the current password is wrong or the new one is unchanged
   */
  public async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // The repository's getById strips the password column, so query directly (same as validateUser)
    const user = await this.db.query.userTable.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.checkPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      // 400 rather than 401 — the web client treats 401 as an expired token and triggers a refresh
      throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashedPassword);
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
