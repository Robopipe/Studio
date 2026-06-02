import { Module } from "@nestjs/common";
import { TaskService } from "./services/task.service";
import { AnnotationService } from "./services/annotation.service";
import { TaskController } from "./controllers/task.controller";
import { AssetsModule } from "../assets/assets.module";

@Module({
  imports: [AssetsModule],
  providers: [TaskService, AnnotationService],
  controllers: [TaskController]
})
export class TaskModule{}
