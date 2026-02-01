import { Body, Controller, Param, ParseIntPipe, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { Public } from "../../auth/decorators/public.decorator";
import { ApiKeyGuard, ApiKeyType } from "../../auth/guards/api-key.guard";
import { TrainingExternalService } from "../services/training-external.service";
import { TrainingProgressRequest } from "../dto/training-external.dto";
import { FileInterceptor } from "@nestjs/platform-express";

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


  @Post("upload/:modelId/:type")
  @UseInterceptors(FileInterceptor("file"))
  public async uploadModelOutput(
    @Param("modelId", ParseIntPipe) modelId: number,
    @Param("type") type: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<void> {
    await this.trainingExternalService.uploadModelOutput(
      modelId,
      type,
      file
    )
  }
}
