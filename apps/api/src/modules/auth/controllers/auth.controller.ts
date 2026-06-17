import {
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { OrganizationListItem, PreAuthToken, Token, User as UserDto } from '@repo/schema';
import { InvitationStatusEnum } from '@repo/schema';
import type { Request, Response } from 'express';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import type { UserEntity } from 'src/modules/user/entities/user.entity';
import { InvitationRepository } from 'src/repository/services/invitation-repository.service';
import { OrganizationMemberRepository } from 'src/repository/services/organization-member-repository.service';
import { Cookie } from '../decorators/cookie.decorator';
import { Public } from '../decorators/public.decorator';
import { User } from '../decorators/user.decorator';
import { EitherAuthGuard } from '../guards/either-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { PreAuthGuard } from '../guards/pre-auth.guard';
import { AuthService } from '../services/auth.service';
import { CreateOrganizationDto, ForgotPasswordDto, RegisterDto, ResendVerificationDto, ResetPasswordDto, SelectOrganizationDto, UserUpdateRequest, VerifyEmailDto } from "../dto/auth.dto";
import type { SessionUser } from '../strategies/jwt.strategy';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly authService: AuthService,
    private readonly invitationRepository: InvitationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
  ) {}

  /**
   * Authenticate with email + password, receive a pre-auth token.
   * @param req - express request with user set by LocalAuthGuard
   * @returns pre-auth token (short-lived, no org context)
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'testpassword' },
      },
    },
  })
  login(@Req() req: Request): PreAuthToken {
    return this.authService.preAuthLogin(req.user as UserEntity);
  }

  /**
   * Pick an organization after login to get a full session token.
   * @param user - pre-auth user from JWT
   * @param body - contains chosen organization ID
   * @param res - express response for refresh cookie
   * @returns session token with org context
   */
  @Post('select-organization')
  @UseGuards(PreAuthGuard)
  async selectOrganization(
    @User() user: UserEntity,
    @Body() body: SelectOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Token> {
    return this.authService.selectOrganization(user.id, body.organizationId, res);
  }

  /**
   * Switch org context for an already authenticated user.
   * @param user - session user
   * @param body - contains target organization ID
   * @param res - express response for refresh cookie
   * @returns new session token for the target org
   */
  @Post('switch-organization')
  @UseGuards(JwtAuthGuard)
  async switchOrganization(
    @User() user: SessionUser,
    @Body() body: SelectOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Token> {
    return this.authService.switchOrganization(user.id, body.organizationId, res);
  }

  /**
   * List organizations the user belongs to.
   * Works with both pre-auth and session tokens.
   */
  @Get('organizations')
  @UseGuards(EitherAuthGuard)
  async listOrganizations(@User() user: UserEntity | SessionUser): Promise<OrganizationListItem[]> {
    return this.authService.listUserOrganizations(user.id);
  }

  /**
   * Create a new organization (user becomes owner).
   * Works with both pre-auth and session tokens.
   */
  @Post('organizations')
  @UseGuards(EitherAuthGuard)
  async createOrganization(
    @User() user: UserEntity | SessionUser,
    @Body() body: CreateOrganizationDto,
  ): Promise<OrganizationListItem> {
    return this.authService.createOrganization(user.id, body.name);
  }

  /**
   * List pending invitations for the pre-auth user's email.
   * @param user - pre-auth user from JWT
   * @returns pending invitation DTOs
   */
  @Get('invitations')
  @UseGuards(PreAuthGuard)
  async listInvitations(@User() user: UserEntity) {
    const invitations = await this.invitationRepository.findPendingByEmail(user.email);
    return invitations.map((inv) => inv.toDto());
  }

  /**
   * Accept a pending invitation and create the membership. Uses a transaction
   * to prevent race conditions on double-accept.
   * @param user - pre-auth user from JWT
   * @param id - invitation ID
   * @returns success message
   * @throws {UnauthorizedException} if the invitation is invalid, expired, or doesn't belong to the user
   * @throws {ConflictException} if the user is already a member of the organization
   */
  @Post('invitations/:id/accept')
  @UseGuards(PreAuthGuard)
  async acceptInvitation(
    @User() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findById(id);
    if (!invitation || !invitation.isValid() || invitation.email !== user.email) {
      throw new UnauthorizedException('Invalid or expired invitation');
    }

    const existing = await this.organizationMemberRepository.getByUserAndOrg(user.id, invitation.organizationId);
    if (existing) {
      await this.invitationRepository.updateStatus(id, InvitationStatusEnum.ACCEPTED);
      throw new ConflictException('You are already a member of this organization');
    }

    await this.organizationMemberRepository.create({
      userId: user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });

    await this.invitationRepository.updateStatus(id, InvitationStatusEnum.ACCEPTED);
    return { message: 'Invitation accepted' };
  }

  /**
   * Decline a pending invitation.
   * @param user - pre-auth user from JWT
   * @param id - invitation ID
   * @returns success message
   * @throws {UnauthorizedException} if the invitation is invalid or doesn't belong to the user
   */
  @Post('invitations/:id/decline')
  @UseGuards(PreAuthGuard)
  async declineInvitation(
    @User() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findById(id);
    if (!invitation || !invitation.isValid() || invitation.email !== user.email) {
      throw new UnauthorizedException('Invalid or expired invitation');
    }

    await this.invitationRepository.updateStatus(id, InvitationStatusEnum.DECLINED);
    return { message: 'Invitation declined' };
  }

  /**
   * Refresh the session using the signed refresh token cookie.
   * @param refreshToken - refresh token from signed cookie
   * @param res - express response for new refresh cookie
   * @returns refreshed session token
   * @throws {UnauthorizedException} if no refresh token is present
   */
  @Post('refresh')
  refresh(
    @Cookie({ name: 'refreshToken', signed: true }) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Token | PreAuthToken> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token cookie');
    }
    return this.authService.refreshLogin(refreshToken, res);
  }

  /**
   * Log out and clear the refresh token cookie.
   * @param res - express response
   */
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
  }

  /**
   * Get the current authenticated user's profile.
   * @param user - session user from JWT
   * @returns user DTO
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@User() user: SessionUser): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
    };
  }

  /**
   * Update the current user's profile.
   * @param user - session user from JWT
   * @param data - fields to update
   * @returns updated user DTO
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@User() user: SessionUser, @Body() data: UserUpdateRequest): Promise<UserDto> {
    const updatedUser = await this.authService.updateProfile(user.id, data);
    return updatedUser.toDto();
  }

  /**
   * Register a new account. Sends a verification email.
   * @param data - registration payload (email, fullName, password)
   * @returns success message
   */
  @Post("register")
  public register(@Body() data: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(data);
  }

  /**
   * Verify an email address using a token from the verification email.
   * @param data - contains the verification token
   * @returns success message
   */
  @Post("verify-email")
  public async verifyEmail(@Body() data: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(data.token);
  }

  /**
   * Resend a verification email if the account exists and is unverified.
   * @param data - contains the email address
   * @returns generic success message (doesn't reveal if email exists)
   */
  @Post("resend-verification")
  public async resendVerification(@Body() data: ResendVerificationDto): Promise<{ message: string }> {
    return this.authService.resendVerification(data.email);
  }

  /**
   * Request a password reset email.
   * @param data - contains the email address
   * @returns generic success message (doesn't reveal if email exists)
   */
  @Post("forgot-password")
  public async forgotPassword(@Body() data: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(data.email);
    return { message: "If an account with that email exists, a reset link has been sent." };
  }

  /**
   * Reset password using a token from the reset email.
   * @param data - contains the reset token and new password
   * @returns success message
   */
  @Post("reset-password")
  public async resetPassword(@Body() data: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(data.token, data.password);
    return { message: "Password has been reset successfully." };
  }
}
