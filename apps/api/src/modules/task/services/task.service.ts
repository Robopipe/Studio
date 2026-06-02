import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { PendingTaskRepository } from "../../../repository/services/pending-task-repository.service";
import { ProjectRepository } from "../../../repository/services/project-repository.service";
import { ProjectLabelRepository } from "../../../repository/services/project-label-repository.service";
import { TaskFileTypeEnum, TaskStatusEnum, type ConfirmTaskUpload, type TaskExport, type TaskUploadUrl } from "@repo/schema";
import { TaskDetailEntity, TaskEntity } from "../entity/task.entity";
import { TaskUpdateRequest } from "../dto/task.dto";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import {
  classificationAnnotationTable,
  classificationAnnotationHistoryTable,
  rectangleAnnotationTable,
  rectangleAnnotationHistoryTable,
  polygonAnnotationTable,
  polygonAnnotationHistoryTable,
  taskTable,
  userTable,
} from "@repo/database";
import { eq, inArray } from "drizzle-orm";
import type { TaskHistory } from "@repo/schema";
import sharp from "sharp";

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly assetsService: AssetsService,
    private readonly taskRepository: TaskRepository,
    private readonly pendingTaskRepository: PendingTaskRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectLabelRepository: ProjectLabelRepository,
  ) {}

  /**
   * Step 1 of the capture upload flow: reserve an iid, stash the GCS object
   * path in `pending_task`, and hand the browser a signed PUT URL.
   */
  public async requestUploadUrl(projectId: number, capturedAt?: string): Promise<TaskUploadUrl> {
    const filename = `image-${Date.now()}.jpeg`;
    const objectPath = this.assetsService.getAssetName(filename, projectId, "asset");

    // Run the DB reservation and the IAM signBlob round-trip in parallel —
    // they're independent (both only need `projectId`/`objectPath`).
    const [pending, uploadUrl] = await Promise.all([
      this.pendingTaskRepository.createWithNextIid(projectId, {
        projectId,
        objectPath,
        capturedAt: capturedAt ? new Date(capturedAt) : null,
      }),
      this.assetsService.generateSignedUploadUrl(objectPath, "image/jpeg"),
    ]);

    return { pendingTaskId: pending.id, uploadUrl, objectPath };
  }

  /**
   * Step 3: browser confirms the upload finished. Verify the object exists,
   * promote the pending row to a real Task (using the dimensions the browser
   * measured locally), and kick off thumbnail generation asynchronously so
   * the user-visible response returns fast.
   */
  public async confirmUpload(projectId: number, data: ConfirmTaskUpload): Promise<TaskEntity> {
    const pending = await this.pendingTaskRepository.getById(data.pendingTaskId);
    if (!pending || pending.projectId !== projectId) {
      throw new NotFoundException("Pending task not found");
    }

    if (!pending.objectPath.startsWith(`${projectId}/assets/`)) {
      throw new BadRequestException("Invalid object path");
    }

    const exists = await this.assetsService.fileExists(pending.objectPath);
    if (!exists) {
      throw new BadRequestException("Uploaded file not found in storage");
    }

    const filePath = this.assetsService.getPublicUrl(pending.objectPath);

    const task = await this.taskRepository.create({
      projectId,
      iid: pending.iid,
      fileType: TaskFileTypeEnum.GS,
      filePath,
      // Placeholder: full image serves as thumbnail until the async job finishes.
      thumbnailUrl: filePath,
      width: data.width,
      height: data.height,
      status: TaskStatusEnum.TODO,
      ...(pending.capturedAt && { createdAt: pending.capturedAt }),
    });

    await this.pendingTaskRepository.delete(pending.id);

    // Fire-and-forget. Requires Cloud Run CPU-always-allocated.
    void this.generateThumbnail(task.id, projectId, pending.objectPath).catch((e) =>
      this.logger.error(`Thumbnail generation failed for task ${task.id}`, e),
    );

    return task;
  }

  /**
   * Background: fetch the uploaded image from GCS, downscale to a 400px webp,
   * upload it, and patch the task row with the real thumbnail URL.
   */
  private async generateThumbnail(taskId: number, projectId: number, sourcePath: string): Promise<void> {
    const buffer = await this.assetsService.downloadFile(sourcePath);
    const thumb = await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbName = this.assetsService.getAssetName(`${taskId}.jpeg`, projectId, "thumbnail");
    const thumbnailUrl = await this.assetsService.saveFile(thumb, "image/webp", thumbName);

    await this.db
      .update(taskTable)
      .set({ thumbnailUrl })
      .where(eq(taskTable.id, taskId));
  }

  public async getTask(id: number, projectId: number): Promise<TaskDetailEntity>{
    return this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId)
  }

  public async getTasks(projectId: number, page: number = 1, limit: number = 50, deleted: boolean | null = false, annotated?: boolean, order: "asc" | "desc" = "asc", labelIds?: number[], ids?: number[]): Promise<{ data: TaskEntity[]; total: number }>{
    return this.taskRepository.getAllByProjectIdPaginated(projectId, page, limit, deleted, annotated, order, labelIds, ids)
  }

  public async getTaskIds(projectId: number, annotated?: boolean, labelIds?: number[], order: "asc" | "desc" = "asc"): Promise<number[]> {
    return this.taskRepository.getAllIdsByProjectId(projectId, annotated, labelIds, order);
  }

  public async updateTask(id: number, projectId: number, data: TaskUpdateRequest, userId: number): Promise<TaskDetailEntity>{
    await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId);

    await this.db.transaction(async(tx) => {
      // === Rectangles ===
      const existingRects = await tx.select().from(rectangleAnnotationTable).where(eq(rectangleAnnotationTable.taskId, id));
      const existingRectById = new Map(existingRects.map(r => [r.id, r]));
      const incomingRects = data.rectangleAnnotations ?? [];
      const rectToInsert = incomingRects.filter(a => !a.id || !existingRectById.has(a.id));
      const rectToUpdate = incomingRects.filter(a => a.id != null && existingRectById.has(a.id!)) as (typeof incomingRects[0] & { id: number })[];
      const incomingRectIds = new Set(incomingRects.filter(a => a.id).map(a => a.id!));
      const rectIdsToDelete = existingRects.filter(r => !incomingRectIds.has(r.id)).map(r => r.id);

      if (rectIdsToDelete.length > 0) {
        await tx.delete(rectangleAnnotationTable).where(inArray(rectangleAnnotationTable.id, rectIdsToDelete));
      }
      if (rectToInsert.length > 0) {
        const inserted = await tx.insert(rectangleAnnotationTable).values(
          rectToInsert.map(a => ({ taskId: id, labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! }))
        ).returning();
        await tx.insert(rectangleAnnotationHistoryTable).values(
          inserted.map(r => ({
            taskId: id,
            annotationId: r.id,
            userId,
            action: 'created' as const,
            snapshot: { labelId: r.labelId, x: r.x, y: r.y, width: r.width, height: r.height },
          }))
        );
      }
      for (const a of rectToUpdate) {
        const existing = existingRectById.get(a.id)!;
        if (existing.labelId !== a.labelId || existing.x !== a.x || existing.y !== a.y || existing.width !== a.width || existing.height !== a.height) {
          await tx.update(rectangleAnnotationTable)
            .set({ labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! })
            .where(eq(rectangleAnnotationTable.id, a.id));
          await tx.insert(rectangleAnnotationHistoryTable).values({
            taskId: id, annotationId: a.id, userId, action: 'updated' as const,
            snapshot: { labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! },
          });
        }
      }

      // === Polygons ===
      const existingPolys = await tx.select().from(polygonAnnotationTable).where(eq(polygonAnnotationTable.taskId, id));
      const existingPolyById = new Map(existingPolys.map(p => [p.id, p]));
      const incomingPolys = data.polygonAnnotations ?? [];
      const polyToInsert = incomingPolys.filter(a => !a.id || !existingPolyById.has(a.id));
      const polyToUpdate = incomingPolys.filter(a => a.id != null && existingPolyById.has(a.id!)) as (typeof incomingPolys[0] & { id: number })[];
      const incomingPolyIds = new Set(incomingPolys.filter(a => a.id).map(a => a.id!));
      const polyIdsToDelete = existingPolys.filter(p => !incomingPolyIds.has(p.id)).map(p => p.id);

      if (polyIdsToDelete.length > 0) {
        await tx.delete(polygonAnnotationTable).where(inArray(polygonAnnotationTable.id, polyIdsToDelete));
      }
      if (polyToInsert.length > 0) {
        const inserted = await tx.insert(polygonAnnotationTable).values(
          polyToInsert.map(a => ({ taskId: id, labelId: a.labelId, value: a.value! }))
        ).returning();
        await tx.insert(polygonAnnotationHistoryTable).values(
          inserted.map(p => ({
            taskId: id, annotationId: p.id, userId, action: 'created' as const,
            snapshot: { labelId: p.labelId, value: p.value },
          }))
        );
      }
      for (const a of polyToUpdate) {
        const existing = existingPolyById.get(a.id)!;
        const valueChanged = JSON.stringify(existing.value) !== JSON.stringify(a.value);
        if (existing.labelId !== a.labelId || valueChanged) {
          await tx.update(polygonAnnotationTable)
            .set({ labelId: a.labelId, value: a.value! })
            .where(eq(polygonAnnotationTable.id, a.id));
          await tx.insert(polygonAnnotationHistoryTable).values({
            taskId: id, annotationId: a.id, userId, action: 'updated' as const,
            snapshot: { labelId: a.labelId, value: a.value! },
          });
        }
      }

      // === Classifications ===
      // A classification whose labelId differs from what's in DB is treated as a new insert
      // to avoid UNIQUE(taskId, labelId) collisions mid-transaction.
      const existingCls = await tx.select().from(classificationAnnotationTable).where(eq(classificationAnnotationTable.taskId, id));
      const existingClsById = new Map(existingCls.map(c => [c.id, c]));
      const incomingCls = data.classificationAnnotations ?? [];
      const clsToKeep = new Set(
        incomingCls.filter(a => a.id != null && existingClsById.has(a.id!) && existingClsById.get(a.id!)!.labelId === a.labelId).map(a => a.id!)
      );
      const clsToInsert = incomingCls.filter(a => !a.id || !clsToKeep.has(a.id));
      const clsIdsToDelete = existingCls.filter(c => !clsToKeep.has(c.id)).map(c => c.id);

      if (clsIdsToDelete.length > 0) {
        await tx.delete(classificationAnnotationTable).where(inArray(classificationAnnotationTable.id, clsIdsToDelete));
      }
      if (clsToInsert.length > 0) {
        const inserted = await tx.insert(classificationAnnotationTable).values(
          clsToInsert.map(a => ({ taskId: id, labelId: a.labelId }))
        ).returning();
        await tx.insert(classificationAnnotationHistoryTable).values(
          inserted.map(c => ({
            taskId: id, annotationId: c.id, userId, action: 'created' as const,
            snapshot: { labelId: c.labelId },
          }))
        );
      }

      const totalCount = incomingRects.length + incomingPolys.length + incomingCls.length;
      const status = totalCount > 0 || data.reviewed ? TaskStatusEnum.DONE : TaskStatusEnum.TODO;
      await tx.update(taskTable).set({ status, annotationCount: totalCount }).where(eq(taskTable.id, id));
    });

    return this.getTask(id, projectId);
  }

  public async getTaskHistory(taskId: number, projectId: number): Promise<TaskHistory> {
    await this.taskRepository.getByIdAndProjectIdOrThrow(taskId, projectId);

    const [rectRows, polyRows, clsRows] = await Promise.all([
      this.db
        .select({
          id: rectangleAnnotationHistoryTable.id,
          annotationId: rectangleAnnotationHistoryTable.annotationId,
          action: rectangleAnnotationHistoryTable.action,
          createdAt: rectangleAnnotationHistoryTable.createdAt,
          snapshot: rectangleAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(rectangleAnnotationHistoryTable)
        .leftJoin(userTable, eq(rectangleAnnotationHistoryTable.userId, userTable.id))
        .where(eq(rectangleAnnotationHistoryTable.taskId, taskId))
        .orderBy(rectangleAnnotationHistoryTable.createdAt),
      this.db
        .select({
          id: polygonAnnotationHistoryTable.id,
          annotationId: polygonAnnotationHistoryTable.annotationId,
          action: polygonAnnotationHistoryTable.action,
          createdAt: polygonAnnotationHistoryTable.createdAt,
          snapshot: polygonAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(polygonAnnotationHistoryTable)
        .leftJoin(userTable, eq(polygonAnnotationHistoryTable.userId, userTable.id))
        .where(eq(polygonAnnotationHistoryTable.taskId, taskId))
        .orderBy(polygonAnnotationHistoryTable.createdAt),
      this.db
        .select({
          id: classificationAnnotationHistoryTable.id,
          annotationId: classificationAnnotationHistoryTable.annotationId,
          action: classificationAnnotationHistoryTable.action,
          createdAt: classificationAnnotationHistoryTable.createdAt,
          snapshot: classificationAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(classificationAnnotationHistoryTable)
        .leftJoin(userTable, eq(classificationAnnotationHistoryTable.userId, userTable.id))
        .where(eq(classificationAnnotationHistoryTable.taskId, taskId))
        .orderBy(classificationAnnotationHistoryTable.createdAt),
    ]);

    const groupRows = (rows: Array<{ id: number; annotationId: number; action: 'created' | 'updated'; createdAt: Date; snapshot: unknown; userId: number | null; userFullName: string | null }>) => {
      const groups = new Map<number, { annotationId: number; events: { id: number; action: 'created' | 'updated'; createdAt: string; user: { id: number; fullName: string } | null; snapshot: unknown }[] }>();
      for (const row of rows) {
        if (!groups.has(row.annotationId)) {
          groups.set(row.annotationId, { annotationId: row.annotationId, events: [] });
        }
        groups.get(row.annotationId)!.events.push({
          id: row.id,
          action: row.action,
          createdAt: row.createdAt.toISOString(),
          user: row.userId ? { id: row.userId, fullName: row.userFullName! } : null,
          snapshot: row.snapshot,
        });
      }
      return Array.from(groups.values());
    };

    return {
      rectangleHistory: groupRows(rectRows) as TaskHistory['rectangleHistory'],
      polygonHistory: groupRows(polyRows) as TaskHistory['polygonHistory'],
      classificationHistory: groupRows(clsRows) as TaskHistory['classificationHistory'],
    };
  }

  public async deleteTask(id: number, projectId: number): Promise<void>{
    const task = await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId)
    await this.taskRepository.delete(task.id)
  }

  /**
   * Build the export JSON — all matching tasks with every annotation type,
   * plus a top-level labels list so labelIds can be decoded externally.
   * Mirrors the shape used by the ML training payload but keeps every
   * annotation type present (not just the one the model trains on).
   */
  public async exportTasks(
    projectId: number,
    annotated?: boolean,
    labelIds?: number[],
  ): Promise<TaskExport> {
    const [project, labels, tasks] = await Promise.all([
      this.projectRepository.getByIdOrThrow(projectId),
      this.projectLabelRepository.getAllByProjectId(projectId),
      this.taskRepository.getAllForExport(projectId, annotated, labelIds),
    ]);

    return {
      project: { id: project.id, name: project.name },
      exportedAt: new Date().toISOString(),
      labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      tasks: tasks.map((task) => ({
        id: task.id,
        iid: task.iid,
        filePath: task.filePath,
        width: task.width,
        height: task.height,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        rectangleAnnotations: task.rectangleAnnotations.map((a) => ({
          id: a.id,
          labelId: a.label.id,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
        })),
        polygonAnnotations: task.polygonAnnotations.map((a) => ({
          id: a.id,
          labelId: a.label.id,
          value: a.value,
        })),
        classificationAnnotations: task.classificationAnnotations.map((a) => ({
          id: a.id,
          labelId: a.label.id,
        })),
      })),
    };
  }
}
