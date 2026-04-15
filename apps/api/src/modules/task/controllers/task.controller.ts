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
import {
  ConfirmTaskUploadDto,
  PaginatedTaskResponse,
  RequestTaskUploadDto,
  TaskDetailResponse,
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
    return this.taskService.requestUploadUrl(projectId, body.capturedAt);
  }

  @Post("confirm")
  public async confirmUpload(
    @ProjectId() projectId: number,
    @Body() body: ConfirmTaskUploadDto,
  ): Promise<TaskResponse> {
    const task = await this.taskService.confirmUpload(projectId, body);
    return task.toResponse();
  }

  @Get()
  public async listTasks(@ProjectId() projectId: number, @Query() query: TaskPaginationQuery): Promise<PaginatedTaskResponse>{
    const { data, total } = await this.taskService.getTasks(projectId, query.page, query.limit, query.deleted, query.annotated, query.order, query.labelIds)
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
  public async updateTask(@ProjectId() projectId: number, @Param("taskId", ParseIntPipe) taskId: number, @Body() data: TaskUpdateRequest): Promise<TaskDetailResponse> {
    const updatedTask = await this.taskService.updateTask(taskId, projectId, data)
    return updatedTask.toDetailResponse()
  }

  @Delete(":taskId")
  public async deleteTask(@ProjectId() projectId: number, @Param("taskId", ParseIntPipe) taskId: number): Promise<void>{
    await this.taskService.deleteTask(taskId, projectId)
  }
}
