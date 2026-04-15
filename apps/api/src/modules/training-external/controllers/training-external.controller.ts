import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { Public } from "../../auth/decorators/public.decorator";
import { ApiKeyGuard, ApiKeyType } from "../../auth/guards/api-key.guard";
import { TrainingExternalService } from "../services/training-external.service";
import { TrainingCompleteRequest, TrainingProgressRequest } from "../dto/training-external.dto";

@Controller("training-external")
@Public()
@UseGuards(ApiKeyGuard(ApiKeyType.TRAINING_EXTERNAL))
export class TrainingExternalController {
  constructor(private readonly trainingExternalService: TrainingExternalService) {}

  @Post("progress/:modelId")
  public async saveTrainingProgress(
    @Param("modelId", ParseIntPipe) modelId: number,
    @Body() data: TrainingProgressRequest
  ): Promise<void>{
    await this.trainingExternalService.updateTrainingProgress(modelId, data)
  }

  @Post("complete/:modelId")
  public async completeTraining(
    @Param("modelId", ParseIntPipe) modelId: number,
    @Body() data: TrainingCompleteRequest,
  ): Promise<void> {
    await this.trainingExternalService.completeTraining(modelId, data)
  }
}
