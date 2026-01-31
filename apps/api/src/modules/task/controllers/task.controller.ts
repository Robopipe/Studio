import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TaskService } from "../services/task.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  TaskDetailResponse,
  TaskResponse,
  TaskUpdateRequest,
} from "../dto/task.dto";

@Controller("task/:projectId")
@UseGuards(ProjectGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  public async createTask(@ProjectId() projectId: number, @UploadedFile() file: Express.Multer.File): Promise<TaskResponse>{
    const createdTask = await this.taskService.createTask(projectId, file)
    return createdTask.toResponse()
  }


  @Get()
  public async listTasks(@ProjectId() projectId: number): Promise<TaskResponse[]>{
    const tasks = await this.taskService.getTasks(projectId)
    return tasks.map((task) => task.toResponse())
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
}
