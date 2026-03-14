import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { DB_CONNECTION } from "../../core/database/database.constant";
import type { DbConnection } from "../../core/database/types/database.types";
import { ProjectLabelEntity } from "../../modules/project/entities/project-label.entity";
import { ProjectLabelInsert, ProjectLabelUpdate } from "../types/project-label";
import { projectLabelTable } from "@repo/database";
import { asc, eq } from "drizzle-orm";

@Injectable()
export class ProjectLabelRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get project label by id and project id
   * @param id
   * @param projectId
   * @returns ProjectLabelEntity or null if not found
   */
  public async getByIdAndProjectId(id: number, projectId: number): Promise<ProjectLabelEntity | null> {
    const label = await this.db.query.projectLabelTable.findFirst({
      where: {
        id,
        projectId
      }
    })

    return label ? new ProjectLabelEntity(label) : null;
  }

  /**
   * Get all labels by project ID
   * @param projectId
   * @returns ProjectLabelEntity[]
   */
  public async getAllByProjectId(projectId: number): Promise<ProjectLabelEntity[]>{
    const labels = await this.db.query.projectLabelTable.findMany({
      where: {
        projectId,
        deletedAt: {
          isNull: true,
        },
      },
      orderBy: (p) => asc(p.id)
    })

    return labels.map((label) => new ProjectLabelEntity(label))
  }

  /**
   * Get all labels by Id in and project id
   * @param ids
   * @param projectId
   * @returns ProjectLabelEntity[]
   */
  public async getAllByIdInAndProjectId(ids: number[], projectId: number): Promise<ProjectLabelEntity[]>{
    const labels = await this.db.query.projectLabelTable.findMany({
      where: {
        projectId,
        deletedAt: {
          isNull: true
        },
        id: {
          in: ids
        }
      },
      orderBy: (p) => asc(p.id)
    })

    return labels.map((label) => new ProjectLabelEntity(label))
  }

  /**
   * Find a soft-deleted label by name and project ID
   * @param name - label name
   * @param projectId
   * @returns ProjectLabelEntity or null
   */
  public async getDeletedByNameAndProjectId(name: string, projectId: number): Promise<ProjectLabelEntity | null> {
    const label = await this.db.query.projectLabelTable.findFirst({
      where: {
        name,
        projectId,
        deletedAt: { isNotNull: true },
      },
    })

    return label ? new ProjectLabelEntity(label) : null;
  }

  /**
   * Restore a soft-deleted label with updated data
   * @param id - label ID
   * @param data - fields to update (name, color)
   * @returns ProjectLabelEntity
   */
  public async restore(id: number, data: ProjectLabelUpdate): Promise<ProjectLabelEntity> {
    const [restored] = await this.db.update(projectLabelTable).set({
      ...data,
      deletedAt: null,
    }).where(eq(projectLabelTable.id, id)).returning()
    if(!restored){
      throw new InternalServerErrorException("Failed restoring project label")
    }

    return new ProjectLabelEntity(restored)
  }

  /**
   * Create project label
   * @param data - ProjectLabelInsert
   * @throws InternalServerErrorException - Failed creating project label
   * @returns ProjectLabelEntity
   */
  public async create(data: ProjectLabelInsert): Promise<ProjectLabelEntity> {
    const [createdProjectLabel] = await this.db.insert(projectLabelTable).values(data).returning()
    if(!createdProjectLabel){
      throw new InternalServerErrorException("Failed creating project label")
    }

    return new ProjectLabelEntity(createdProjectLabel)
  }

  /**
   * Update project label
   * @param id - project label ID
   * @param data - ProjectLabelUpdate
   * @throws InternalServerErrorException - Failed updating project
   * @returns ProjectLabelEntity
   */
  public async update(id: number, data: ProjectLabelUpdate): Promise<ProjectLabelEntity> {
    const [updatedProjectLabel] = await this.db.update(projectLabelTable).set(data).where(eq(projectLabelTable.id, id)).returning()
    if(!updatedProjectLabel){
      throw new InternalServerErrorException("Failed updating project label")
    }

    return new ProjectLabelEntity(updatedProjectLabel)
  }

  /**
   * Delete project label
   * @param id - project label id
   */
  public async delete(id: number): Promise<void>{
    await this.db.update(projectLabelTable).set({
      deletedAt: new Date()
    }).where(eq(projectLabelTable.id, id))
  }
}
