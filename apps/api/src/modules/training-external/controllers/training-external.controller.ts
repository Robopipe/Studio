import { Controller, Post, UseGuards } from "@nestjs/common";
import { Public } from "../../auth/decorators/public.decorator";
import { ApiKeyGuard, ApiKeyType } from "../../auth/guards/api-key.guard";
import { TrainingExternalService } from "../services/training-external.service";

@Controller("training-external")
@Public()
@UseGuards(ApiKeyGuard(ApiKeyType.TRAINING_EXTERNAL))
export class TrainingExternalController {
  constructor(private readonly trainingExternalService: TrainingExternalService) {}


  @Post("progress")
  public async saveTrainingProgress(): Promise<void>{}

  @Post("complete")
  public async completeTraining(): Promise<void>{}
}
