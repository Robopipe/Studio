import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { projectTable } from '@repo/database/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { ProjectEntity } from 'src/modules/project/entities/project.entity';
import type { ProjectInsert, ProjectUpdate } from '../types/project';

@Injectable()
export class ProjectRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get project by id
   * @param id
   * @returns ProjectEntity or null if not found
   */
  public async getById(id: number): Promise<ProjectEntity | null> {
    const project = await this.db.query.projectTable.findFirst({
      where: { id },
    });

    return project ? new ProjectEntity(project) : null;
  }

  /**
   * Get project by id or throw
   * @param id
   * @throws NotFoundException - Project not found
   * @returns ProjectEntity
   */
  public async getByIdOrThrow(id: number): Promise<ProjectEntity> {
    const project = await this.getById(id);
    if(!project){
      throw new NotFoundException("Project not found")
    }
    return project
  }

  /**
   * Get all projects by org id
   * @param organizationId
   * @returns Project entities
   */
  public async getAllByOrganizationId(organizationId: number): Promise<ProjectEntity[]> {
    const projects = await this.db.query.projectTable.findMany({
      where: {
        organizationId,
        deletedAt: {
          isNull: true
        }
      },
    });

    return projects.map((p) => new ProjectEntity(p));
  }

  /**
   * Create project
   * @param data - ProjectInsert
   * @throws InternalServerErrorException - Failed creating project
   * @returns Created Project entity
   */
  public async create(data: ProjectInsert): Promise<ProjectEntity> {
    const [project] = await this.db.insert(projectTable).values(data).returning();

    if(!project){
      throw new InternalServerErrorException("Failed creating project")
    }

    return new ProjectEntity(project);
  }

  /**
   * Update project
   * @param id
   * @param data - ProjectUpdate
   * @throws InternalServerErrorException - Failed updating project
   * @returns Updated project entity
   */
  public async update(id: number, data: ProjectUpdate): Promise<ProjectEntity> {
    const [updated] = await this.db
      .update(projectTable)
      .set(data)
      .where(eq(projectTable.id, id))
      .returning();

    if (!updated) {
      throw new InternalServerErrorException('Failed updating project');
    }

    return new ProjectEntity(updated);
  }

  /**
   * Delete project
   * @param id
   */
  public async delete(id: number): Promise<void> {
    await this.db.update(projectTable).set({
      deletedAt: new Date()
    }).where(eq(projectTable.id, id))
  }
}
