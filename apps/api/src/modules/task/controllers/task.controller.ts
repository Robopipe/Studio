import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TaskService } from "../services/task.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { User } from "../../auth/decorators/user.decorator";
import type { SessionUser } from "../../auth/strategies/jwt.strategy";
import {
  ConfirmTaskUploadDto,
  ImportedEventIdsResponseDto,
  ImportedEventsQueryDto,
  ImportedSourceTaskIdsQueryDto,
  ImportedSourceTaskIdsResponseDto,
  ImportTasksDto,
  ImportTasksResponseDto,
  PaginatedTaskResponse,
  RequestTaskUploadDto,
  TaskDetailResponse,
  TaskExportQuery,
  TaskExportResponse,
  TaskHistoryResponse,
  TaskIdsQuery,
  TaskIdsResponseDto,
  TaskPaginationQuery,
  TaskResponse,
  TaskUpdateRequest,
  TaskUploadUrlResponse,
} from "../dto/task.dto";

@Controller("task/:projectId")
@UseGuards(ProjectGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post("upload-url")
  public async requestUploadUrl(
    @ProjectId() projectId: number,
    @Body() body: RequestTaskUploadDto,
  ): Promise<TaskUploadUrlResponse> {
    return this.taskService.requestUploadUrl(projectId, body.capturedAt, body.contentType);
  }

  @Post("confirm")
  public async confirmUpload(
    @ProjectId() projectId: number,
    @Body() body: ConfirmTaskUploadDto,
    @User('id') userId: number,
  ): Promise<TaskResponse> {
    const task = await this.taskService.confirmUpload(projectId, body, userId);
    return task.toResponse();
  }

  @Get("export")
  public async exportTasks(
    @ProjectId() projectId: number,
    @Query() query: TaskExportQuery,
  ): Promise<TaskExportResponse> {
    return this.taskService.exportTasks(projectId, query.annotated, query.labelIds);
  }

  @Get("ids")
  public async listTaskIds(
    @ProjectId() projectId: number,
    @Query() query: TaskIdsQuery,
  ): Promise<TaskIdsResponseDto> {
    const ids = await this.taskService.getTaskIds(projectId, query.annotated, query.labelIds, query.sortBy, query.sortOrder);
    return { ids };
  }

  @Get("imported-events")
  public async listImportedEvents(
    @ProjectId() projectId: number,
    @Query() query: ImportedEventsQueryDto,
  ): Promise<ImportedEventIdsResponseDto> {
    const eventIds = await this.taskService.getImportedEventIds(projectId, query.dashboardId, query.eventIds);
    return { eventIds };
  }

  @Post("import")
  public async importTasks(
    @ProjectId() projectId: number,
    @Body() body: ImportTasksDto,
    @User() user: SessionUser,
  ): Promise<ImportTasksResponseDto> {
    const { imported, failed } = await this.taskService.importTasks(projectId, body, user.id, user.organizationId);
    return { imported: imported.map((task) => task.toResponse()), failed };
  }

  @Get("imported-source-tasks")
  public async listImportedSourceTasks(
    @ProjectId() projectId: number,
    @Query() query: ImportedSourceTaskIdsQueryDto,
  ): Promise<ImportedSourceTaskIdsResponseDto> {
    const taskIds = await this.taskService.getImportedSourceTaskIds(projectId, query.sourceProjectId);
    return { taskIds };
  }

  @Get()
  public async listTasks(@ProjectId() projectId: number, @Query() query: TaskPaginationQuery): Promise<PaginatedTaskResponse>{
    const { data, total } = await this.taskService.getTasks(projectId, query.page, query.limit, query.deleted, query.annotated, query.sortBy, query.sortOrder, query.labelIds, query.ids, query.updatedBy)
    return {
      data: data.map((task) => task.toResponse()),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  @Get(":taskId")
  public async getTask(@ProjectId() projectId: number, @Param("taskId", ParseIntPipe) taskId: number): Promise<TaskDetailResponse> {
    const task = await this.taskService.getTask(taskId, projectId);
    return task.toDetailResponse()
  }

  @Put(":taskId")
  public async updateTask(
    @ProjectId() projectId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
    @Body() data: TaskUpdateRequest,
    @User('id') userId: number,
  ): Promise<TaskDetailResponse> {
    const updatedTask = await this.taskService.updateTask(taskId, projectId, data, userId)
    return updatedTask.toDetailResponse()
  }

  @Get(":taskId/history")
  public async getTaskHistory(
    @ProjectId() projectId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
  ): Promise<TaskHistoryResponse> {
    return this.taskService.getTaskHistory(taskId, projectId);
  }

  @Delete(":taskId")
  public async deleteTask(@ProjectId() projectId: number, @Param("taskId", ParseIntPipe) taskId: number): Promise<void>{
    await this.taskService.deleteTask(taskId, projectId)
  }
}
