import type { Project } from '@repo/schema';
import type { ProjectSelect } from 'src/repository/types/project';

export class ProjectEntity {
  readonly id: number;
  readonly name: string;
  readonly organizationId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ProjectSelect) {
    Object.assign(this, data);
  }

  public toDto(): Project {
    return {
      id: this.id,
      name: this.name,
      organizationId: this.organizationId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null
    };
  }
}
