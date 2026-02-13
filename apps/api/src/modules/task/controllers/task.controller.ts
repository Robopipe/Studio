import {
  Body,
  Controller, Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TaskService } from "../services/task.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  CreateTaskQuery,
  PaginatedTaskResponse,
  TaskDetailResponse,
  TaskPaginationQuery,
  TaskResponse,
  TaskUpdateRequest,
} from "../dto/task.dto";

@Controller("task/:projectId")
@UseGuards(ProjectGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  public async createTask(@ProjectId() projectId: number, @UploadedFile() file: Express.Multer.File, @Query() query: CreateTaskQuery): Promise<TaskResponse>{
    const createdTask = await this.taskService.createTask(projectId, file, query.iid)
    return createdTask.toResponse()
  }


  @Get()
  public async listTasks(@ProjectId() projectId: number, @Query() query: TaskPaginationQuery): Promise<PaginatedTaskResponse>{
    const { data, total } = await this.taskService.getTasks(projectId, query.page, query.limit, query.deleted)
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
