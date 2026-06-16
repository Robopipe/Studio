import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { PreAuthToken } from '@repo/schema';
import type { Invitation, OrganizationMembersResponse } from '@repo/schema';
import { OrgMemberRoleEnum } from '@repo/schema';
import type { Response } from 'express';
import { InviteUserDto } from 'src/modules/auth/dto/auth.dto';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { User } from 'src/modules/auth/decorators/user.decorator';
import { AuthService } from 'src/modules/auth/services/auth.service';
import type { SessionUser } from 'src/modules/auth/strategies/jwt.strategy';
import { OrganizationService } from '../services/organization.service';
import {
  OrganizationResponse,
  OrganizationUpdateRequest,
  UpdateMemberRoleDto,
} from "../dto/organization.dto";

@Controller("organizations")
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService,
  ) {}

  /**
   * @param organizationId - from session JWT
   * @returns current organization DTO
   */
  @Get("current")
  public async getCurrent(
    @User("organizationId") organizationId: number,
  ): Promise<OrganizationResponse> {
    const organization =
      await this.organizationService.getOrganization(organizationId);
    return organization.toDto();
  }

  /**
   * Delete the current organization. Only OWNER may perform this action.
   * Soft-deletes the org and returns a pre-auth token so the owner's session
   * gracefully drops to org-selection.
   */
  @Delete("current")
  @UseGuards(RolesGuard)
  @Roles(OrgMemberRoleEnum.OWNER)
  public async delete(
    @User("id") userId: number,
    @User("organizationId") organizationId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PreAuthToken> {
    await this.organizationService.delete(organizationId);
    return this.authService.issuePreAuthAfterOrgDeletion(userId, res);
  }

  /**
   * Rename the current organization. Requires ADMIN or OWNER role.
   * @param organizationId - from session JWT
   * @param body - fields to update
   * @returns updated organization DTO
   */
  @Patch("current")
  @UseGuards(AdminGuard)
  public async update(
    @User("organizationId") organizationId: number,
    @Body() body: OrganizationUpdateRequest,
  ): Promise<OrganizationResponse> {
    const organization = await this.organizationService.update(
      organizationId,
      body,
    );
    return organization.toDto();
  }

  /**
   * @param organizationId - from session JWT
   * @returns members list with nested user data
   */
  @Get("current/members")
  public async getMembers(
    @User("organizationId") organizationId: number,
  ): Promise<OrganizationMembersResponse> {
    const members = await this.organizationService.getMembers(organizationId);
    return { members: members.map((m) => m.toDto()) };
  }

  /**
   * Send an invitation email. Requires ADMIN or OWNER role.
   * @param user - session user
   * @param body - contains the invitee's email
   * @returns success message
   */
  @Post("current/invite")
  @UseGuards(AdminGuard)
  public async inviteUser(
    @User() user: SessionUser,
    @Body() body: InviteUserDto,
  ): Promise<{ message: string }> {
    await this.organizationService.inviteUser(
      user.organizationId,
      body.email,
      user.id,
      body.role,
    );
    return { message: "Invitation sent successfully." };
  }

  /**
   * List pending invitations for the current organization. Requires ADMIN or OWNER role.
   * @param organizationId - from session JWT
   * @returns pending invitations
   */
  @Get("current/invitations")
  @UseGuards(AdminGuard)
  public async getInvitations(
    @User("organizationId") organizationId: number,
  ): Promise<Invitation[]> {
    const invitations = await this.organizationService.getInvitations(organizationId);
    return invitations.map((inv) => inv.toDto());
  }

  /**
   * Revoke a pending invitation. Requires ADMIN or OWNER role.
   * @param user - session user (for org context)
   * @param invitationId - invitation to revoke
   * @returns success message
   */
  @Delete("current/invitations/:invitationId")
  @UseGuards(AdminGuard)
  public async revokeInvitation(
    @User("organizationId") organizationId: number,
    @Param("invitationId", ParseIntPipe) invitationId: number,
  ): Promise<{ message: string }> {
    await this.organizationService.revokeInvitation(organizationId, invitationId);
    return { message: "Invitation revoked." };
  }

  /**
   * Remove a member from the organization. Requires ADMIN or OWNER role.
   * @param user - session user (for org context and role check)
   * @param userId - member to remove
   * @returns success message
   */
  @Delete("current/members/:userId")
  @UseGuards(AdminGuard)
  public async removeMember(
    @User() user: SessionUser,
    @Param("userId", ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    await this.organizationService.removeMember(user.organizationId, userId, user.role);
    return { message: "Member removed." };
  }

  /**
   * Change a member's role. Requires ADMIN or OWNER role.
   * @param user - session user (for org context and role check)
   * @param userId - target member
   * @param body - contains the new role
   * @returns success message
   */
  @Patch("current/members/:userId/role")
  @UseGuards(AdminGuard)
  public async updateMemberRole(
    @User() user: SessionUser,
    @Param("userId", ParseIntPipe) userId: number,
    @Body() body: UpdateMemberRoleDto,
  ): Promise<{ message: string }> {
    await this.organizationService.updateMemberRole(user.organizationId, userId, body.role);
    return { message: "Role updated." };
  }
}
