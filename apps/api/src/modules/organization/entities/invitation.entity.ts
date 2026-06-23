import type { AssignableRole, Invitation } from '@repo/schema';
import { OrgMemberRoleEnum } from '@repo/schema';
import type { InvitationSelect } from 'src/repository/types/invitation';

export class InvitationEntity {
  readonly id: number;
  readonly email: string;
  readonly organizationId: number;
  readonly invitedById: number;
  readonly token: string;
  readonly status: string;
  readonly role: OrgMemberRoleEnum;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly organizationName?: string;

  constructor(data: InvitationSelect) {
    Object.assign(this, data);
  }

  /**
   * @returns true if the invitation is still pending and not expired
   */
  isValid(): boolean {
    return this.status === 'PENDING' && this.expiresAt > new Date();
  }

  /**
   * @returns API response shape with dates serialized as ISO strings
   */
  toDto(): Invitation {
    return {
      id: this.id,
      email: this.email,
      organizationName: this.organizationName ?? '',
      status: this.status as Invitation['status'],
      role: this.role as AssignableRole,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
