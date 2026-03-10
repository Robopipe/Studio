import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateOrganizationRequest } from '@repo/schema';
import { InvitationStatusEnum, OrgMemberRoleEnum } from '@repo/schema';
import { randomBytes } from 'crypto';
import { AppConfig } from 'src/core/configuration/app.config';
import { EmailService } from 'src/modules/email/email.service';
import { OrganizationMemberEntity } from '../entities/organization-member.entity';
import { OrganizationEntity } from '../entities/organization.entity';
import { InvitationRepository } from 'src/repository/services/invitation-repository.service';
import { OrganizationMemberRepository } from 'src/repository/services/organization-member-repository.service';
import { OrganizationRepository } from 'src/repository/services/organization-repository.service';
import { UserRepository } from 'src/repository/services/user-repository.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly config: AppConfig,
  ) {}

  /**
   * @param id - organization ID
   * @returns the organization entity
   * @throws {NotFoundException} if the organization doesn't exist
   */
  public async getOrganization(id: number): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.getById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  /**
   * @param id - organization ID
   * @param data - fields to update
   * @returns the updated organization entity
   * @throws {NotFoundException} if the organization doesn't exist
   */
  public async update(id: number, data: UpdateOrganizationRequest): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.update(id, data);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  /**
   * @param organizationId - organization ID
   * @returns active members with user data
   */
  public async getMembers(organizationId: number): Promise<OrganizationMemberEntity[]> {
    return this.organizationMemberRepository.getAllByOrgId(organizationId);
  }

  /**
   * Creates an invitation record and sends an email with the invite link.
   * @param organizationId - target organization
   * @param email - invitee's email address
   * @param invitedById - ID of the user sending the invitation
   * @throws {ConflictException} if a pending invitation already exists or the user is already a member
   */
  public async inviteUser(organizationId: number, email: string, invitedById: number): Promise<void> {
    const pendingInvitations = await this.invitationRepository.findPendingByEmail(email);
    const alreadyInvited = pendingInvitations.some((inv) => inv.organizationId === organizationId);
    if (alreadyInvited) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    const existingUser = await this.userRepository.getByEmail(email);
    if (existingUser) {
      const membership = await this.organizationMemberRepository.getByUserAndOrg(existingUser.id, organizationId);
      if (membership) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.invitationRepository.create({
      email,
      organizationId,
      invitedById,
      token,
      expiresAt,
    });

    const org = await this.organizationRepository.getById(organizationId);
    const inviteLink = `${this.config.webHost}/login`;
    await this.emailService.sendInvitationEmail(email, org?.name ?? 'your organization', inviteLink);
  }

  /**
   * Removes the membership. Only owners can remove admins.
   * @param organizationId - organization context
   * @param userId - member to remove
   * @param requestingUserRole - role of the user performing the action
   * @throws {NotFoundException} if the membership doesn't exist
   * @throws {ForbiddenException} if trying to remove the owner, or an admin trying to remove another admin
   */
  public async removeMember(organizationId: number, userId: number, requestingUserRole: string): Promise<void> {
    const membership = await this.organizationMemberRepository.getByUserAndOrg(userId, organizationId);
    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === OrgMemberRoleEnum.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    if (membership.role === OrgMemberRoleEnum.ADMIN && requestingUserRole !== OrgMemberRoleEnum.OWNER) {
      throw new ForbiddenException('Only the owner can remove admins');
    }

    await this.organizationMemberRepository.remove(userId, organizationId);
  }

  /**
   * Only owners can change an admin's role.
   * @param organizationId - organization context
   * @param userId - target member
   * @param role - new role (ADMIN or MEMBER only)
   * @param requestingUserRole - role of the user performing the action
   * @throws {NotFoundException} if the membership doesn't exist
   * @throws {ForbiddenException} if targeting an owner, or an admin trying to change another admin's role
   */
  public async updateMemberRole(
    organizationId: number,
    userId: number,
    role: OrgMemberRoleEnum,
    requestingUserRole: string,
  ): Promise<void> {
    const membership = await this.organizationMemberRepository.getByUserAndOrg(userId, organizationId);
    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === OrgMemberRoleEnum.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    if (membership.role === OrgMemberRoleEnum.ADMIN && requestingUserRole !== OrgMemberRoleEnum.OWNER) {
      throw new ForbiddenException('Only the owner can change admin roles');
    }

    await this.organizationMemberRepository.updateRole(userId, organizationId, role);
  }
}
