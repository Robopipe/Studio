import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { PendingTaskRepository } from "../../../repository/services/pending-task-repository.service";
import { ProjectRepository } from "../../../repository/services/project-repository.service";
import { ProjectLabelRepository } from "../../../repository/services/project-label-repository.service";
import { TaskFileTypeEnum, TaskStatusEnum, TaskSortBy, type ConfirmTaskUpload, type TaskExport, type TaskUploadUrl } from "@repo/schema";
import { TaskDetailEntity, TaskEntity } from "../entity/task.entity";
import { TaskUpdateRequest } from "../dto/task.dto";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import { taskTable } from "@repo/database";
import { eq } from "drizzle-orm";
import type { TaskHistory } from "@repo/schema";
import sharp from "sharp";
import { AnnotationService } from "./annotation.service";

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
    private readonly annotationService: AnnotationService,
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
  public async confirmUpload(projectId: number, data: ConfirmTaskUpload, userId: number): Promise<TaskEntity> {
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
      updatedBy: userId,
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

  public async getTasks(projectId: number, page: number = 1, limit: number = 50, deleted: boolean | null = false, annotated?: boolean, sortBy: TaskSortBy = "createdAt", sortOrder: "asc" | "desc" = "desc", labelIds?: number[], ids?: number[], updatedBy?: number[]): Promise<{ data: TaskEntity[]; total: number }>{
    return this.taskRepository.getAllByProjectIdPaginated(projectId, page, limit, deleted, annotated, sortBy, sortOrder, labelIds, ids, updatedBy)
  }

  public async getTaskIds(projectId: number, annotated?: boolean, labelIds?: number[], sortBy: TaskSortBy = "createdAt", sortOrder: "asc" | "desc" = "desc"): Promise<number[]> {
    return this.taskRepository.getAllIdsByProjectId(projectId, annotated, labelIds, sortBy, sortOrder);
  }

  public async updateTask(id: number, projectId: number, data: TaskUpdateRequest, userId: number): Promise<TaskDetailEntity>{
    await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId);

    await this.db.transaction(async(tx) => {
      const totalCount = await this.annotationService.upsertAnnotations(tx, id, data, userId);
      const status = totalCount > 0 || data.reviewed ? TaskStatusEnum.DONE : TaskStatusEnum.TODO;
      await tx.update(taskTable).set({ status, annotationCount: totalCount, updatedBy: userId }).where(eq(taskTable.id, id));
    });

    return this.getTask(id, projectId);
  }

  public async getTaskHistory(taskId: number, projectId: number): Promise<TaskHistory> {
    await this.taskRepository.getByIdAndProjectIdOrThrow(taskId, projectId);
    return this.annotationService.getHistory(taskId);
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
          groupId: a.groupId ?? null,
        })),
        polygonAnnotations: task.polygonAnnotations.map((a) => ({
          id: a.id,
          labelId: a.label.id,
          value: a.value,
          groupId: a.groupId ?? null,
        })),
        classificationAnnotations: task.classificationAnnotations.map((a) => ({
          id: a.id,
          labelId: a.label.id,
        })),
      })),
    };
  }
}
