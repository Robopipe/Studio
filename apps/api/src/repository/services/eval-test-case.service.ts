import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { EvalTestCaseDetailEntity, EvalTestCaseEntity, EvalTestCaseThresholdEntity } from "src/modules/eval/entities/eval-test-case.entity";
import { EvalTestCaseDetailSelect, EvalTestCaseInsert, EvalTestCaseSelect } from "../types/eval";
import { evalTestCaseTable } from "@repo/database";
import type { EvalLogicNode } from "@repo/schema";
import { and, asc, eq } from "drizzle-orm";

@Injectable()
export class EvalTestCaseRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection){}

  /**
   * Get all by project ID, optionally filtered by dashboard configuration
   * @param projectId
   * @param dashboardConfigurationId - optional filter
   * @returns EvalTestCaseEntity[]
   */
  public async getAllByProjectId(projectId: number, dashboardConfigurationId?: number): Promise<EvalTestCaseEntity[]>{
    const testCases = await this.db.query.evalTestCaseTable.findMany({
      where: {
        projectId,
        ...(dashboardConfigurationId !== undefined && { dashboardConfigurationId }),
      },
      columns: {
        logicNodes: false,
      },
      with: {
        limits: {
          with: {
            targetLabel: true,
            targetParentLabel: true
          },
          orderBy: (limit) => asc(limit.createdAt)
        }
      },
      orderBy: (testCase) => asc(testCase.createdAt)
    })

    return testCases.map((testCase) => new EvalTestCaseEntity(testCase as EvalTestCaseSelect))
  }

  /**
   * Get all thresholds by project id, optionally filtered by dashboard configuration
   * @param projectId
   * @param dashboardConfigurationId - optional filter
   * @returns EvalTestCaseThresholdEntity[]
   */
  public async getAllThresholdsByProjectId(projectId: number, dashboardConfigurationId?: number): Promise<EvalTestCaseThresholdEntity[]>{
    const testCases = await this.db.query.evalTestCaseTable.findMany({
      where: {
        projectId,
        ...(dashboardConfigurationId !== undefined && { dashboardConfigurationId }),
      },
      with: {
        thresholds: {
          orderBy: (thresshold) => asc(thresshold.value)
        }
      },
      orderBy: (testCase) => asc(testCase.createdAt)
    })

    return testCases.map((testCase) => new EvalTestCaseThresholdEntity(testCase))
  }

  /**
   * Get threshold by id and project id
   * @param id
   * @param projectId
   * @returns EvalTestCaseThresholdEntity or null if not found
   */
  public async getThresholdByIdAndProjectId(id: string, projectId: number): Promise<EvalTestCaseThresholdEntity | null>{
    const testCase = await this.db.query.evalTestCaseTable.findFirst({
      where: {
        id,
        projectId,
      },
      with: {
        thresholds: {
          orderBy: (thresshold) => asc(thresshold.value)
        }
      },
    })

    return testCase ? new EvalTestCaseThresholdEntity(testCase) : null;
  }

  /**
   * Get threshold by id and project id or throw
   * @param id
   * @param projectId
   * @throws NotFoundException - Test case not found
   * @returns EvalTestCaseThresholdEntity
   */
  public async getThresholdByIdAndProjectIdOrThrow(id: string, projectId: number): Promise<EvalTestCaseThresholdEntity>{
    const testCase = await this.getThresholdByIdAndProjectId(id, projectId);
    if(!testCase){
      throw new NotFoundException("Test case not found")
    }

    return testCase
  }

  /**
   * Verify test case exists and belongs to the given project and config.
   * Lightweight query — no relations loaded.
   * @throws NotFoundException
   */
   public async verifyOwnership(id: string, projectId: number, dashboardConfigurationId: number): Promise<void>{
     const testCase = await this.db.query.evalTestCaseTable.findFirst({
       where: { id, projectId, dashboardConfigurationId },
       columns: { id: true },
     })
     if(!testCase){
       throw new NotFoundException('Test case not found')
     }
   }

  /**
   * Get logic nodes for a test case. Lightweight — only fetches logicNodes column.
   * @throws NotFoundException
   */
   public async getLogicNodes(id: string, projectId: number, dashboardConfigurationId: number): Promise<EvalLogicNode[]>{
     const testCase = await this.db.query.evalTestCaseTable.findFirst({
       where: { id, projectId, dashboardConfigurationId },
       columns: { logicNodes: true },
     })
     if(!testCase){
       throw new NotFoundException('Test case not found')
     }
     return testCase.logicNodes ?? []
   }

  /**
   * Get test case detail by id, scoped to project and config.
   * @throws NotFoundException
   */
   public async getDetailOrThrow(id: string, projectId: number, dashboardConfigurationId: number): Promise<EvalTestCaseDetailEntity>{
     const testCase = await this.db.query.evalTestCaseTable.findFirst({
       where: { id, projectId, dashboardConfigurationId },
       with: {
         limits: {
           with: {
             targetLabel: true,
             targetParentLabel: true
           },
           orderBy: (limit) => asc(limit.createdAt)
         }
       }
     })
     if(!testCase){
       throw new NotFoundException('Test case not found')
     }
     return new EvalTestCaseDetailEntity(testCase as EvalTestCaseDetailSelect)
   }

  /**
   * Get test case by id and project id
   * @param id
   * @param projectId
   * @return EvalTestCaseDetailEntity or null if not found
   */
   public async getByIdAndProjectId(id: string, projectId: number): Promise<EvalTestCaseDetailEntity | null>{
     const testCase = await this.db.query.evalTestCaseTable.findFirst({
       where: {
         id,
         projectId,
       },
       with: {
         limits: {
           with: {
             targetLabel: true,
             targetParentLabel: true
           },
           orderBy: (limit) => asc(limit.createdAt)
         }
       }
     })

     return testCase ? new EvalTestCaseDetailEntity(testCase as EvalTestCaseDetailSelect) : null;
   }


   /**
    * Get by id and project id or throw
    * @param id
    * @param projectId
    * @throws NotFoundException - Test case not found
    * @returns EvalTestCaseDetailEntity
    */
   public async getByIdAndProjectIdOrThrow(id: string, projectId: number): Promise<EvalTestCaseDetailEntity>{
     const testCase = await this.getByIdAndProjectId(id, projectId)
     if(!testCase){
       throw new NotFoundException('Test case not found')
     }

     return testCase
   }

   /**
    * Create test case
    * @param projectId
    * @param dashboardConfigurationId
    * @param data
    * @throws InternalServerErrorException - Failed creating test case
    * @returns EvalTestCaseDetailEntity
    */
   public async create(projectId: number, dashboardConfigurationId: number, data: EvalTestCaseInsert): Promise<EvalTestCaseDetailEntity>{
     const [createdTestCase] = await this.db.insert(evalTestCaseTable).values({
       ...data,
       projectId,
       dashboardConfigurationId,
     }).returning()

     if(!createdTestCase){
       throw new InternalServerErrorException("Failed creating test case")
     }

     return new EvalTestCaseDetailEntity({...createdTestCase, limits: []})
   }


   /**
    * Update test case by id and project id
    * @param id
    * @param projectId
    * @param data - EvalTestCaseInsert
    * @throws InternalServerErrorException - Failed updating test case
    * @throws NotFoundException - Test case not found
    * @returns EvalTestCaseDetailEntity
    */
   public async update(id: string, projectId: number, data: EvalTestCaseInsert): Promise<EvalTestCaseDetailEntity>{
     const [updatedTestCaseId] = await this.db.update(evalTestCaseTable)
      .set(data)
      .where(
       and(
         eq(evalTestCaseTable.projectId, projectId),
         eq(evalTestCaseTable.id, id)
       )
     ).returning({id: evalTestCaseTable.id})

     if(!updatedTestCaseId){
       throw new InternalServerErrorException("Failed updating test case")
     }

     return this.getByIdAndProjectIdOrThrow(id, projectId)
   }

   /**
    * Delete by id and project id
    * @param id
    * @param projectId
    */
   public async delete(id: string, projectId: number): Promise<void>{
     await this.db.delete(evalTestCaseTable).where(
       and(
         eq(evalTestCaseTable.id, id),
         eq(evalTestCaseTable.projectId, projectId)
       )
     )
   }
}
