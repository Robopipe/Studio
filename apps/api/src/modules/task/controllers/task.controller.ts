import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TaskService } from "../services/task.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { TaskDetailResponse, TaskResponse } from "../dto/task.dto";

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
}
