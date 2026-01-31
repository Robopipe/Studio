import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { ProjectService } from './services/project.service';
import { ProjectLabelsController } from "./controllers/project-labels.controller";
import { ProjectLabelsService } from "./services/project-labels.service";

@Module({
  controllers: [ProjectController, ProjectLabelsController],
  providers: [ProjectService, ProjectLabelsService],
})
export class ProjectModule {}
