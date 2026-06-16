import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PredictRequest, PredictResponse } from "@repo/schema";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { PredictRequestDto } from "../dto/predict.dto";
import { PredictService } from "../services/predict.service";

@Controller("predict/:projectId")
@UseGuards(ProjectGuard)
export class PredictController {
  constructor(private readonly predictService: PredictService) {}

  @Post(":taskId")
  public async predict(
    @ProjectId() projectId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
    @Body() body: PredictRequestDto,
  ): Promise<PredictResponse> {
    return this.predictService.predict(projectId, taskId, body as PredictRequest);
  }
}
