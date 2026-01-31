import type { Organization } from '@repo/schema';
import type { OrganizationSelect } from 'src/repository/types/organization';

export class OrganizationEntity {
  readonly id: number;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: OrganizationSelect) {
    Object.assign(this, data);
  }

  toDto(): Organization {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
