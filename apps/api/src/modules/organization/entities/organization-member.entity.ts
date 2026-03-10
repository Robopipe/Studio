import type { OrganizationMember } from '@repo/schema';
import type { OrgMemberRoleEnum } from '@repo/schema';
import type { OrganizationMemberSelect } from 'src/repository/types/organization-member';
import { UserEntity } from 'src/modules/user/entities/user.entity';

export class OrganizationMemberEntity {
  readonly id: number;
  readonly userId: number;
  readonly organizationId: number;
  readonly role: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user?: UserEntity;
  readonly organizationName?: string;

  constructor(data: OrganizationMemberSelect) {
    this.id = data.id;
    this.userId = data.userId;
    this.organizationId = data.organizationId;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.user) {
      this.user = new UserEntity(data.user);
    }
    if (data.organization) {
      this.organizationName = data.organization.name;
    }
  }

  /**
   * @returns API response shape with nested user DTO and role
   */
  toDto(): OrganizationMember {
    return {
      user: this.user!.toDto(),
      role: this.role as OrgMemberRoleEnum,
    };
  }
}
