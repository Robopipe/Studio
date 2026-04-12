import { Injectable } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { CapturedVideoRepository } from "../../../repository/services/captured-video-repository.service";
import { CapturedVideoEntity } from "../entity/captured-video.entity";

@Injectable()
export class CapturedVideoService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly capturedVideoRepository: CapturedVideoRepository,
  ) {}

  public async createCapturedVideo(
    projectId: number,
    file: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
    query: { durationMs: number },
  ): Promise<CapturedVideoEntity> {
    const videoAssetName = this.assetsService.getAssetName(file.originalname, projectId, "video");
    const thumbnailAssetName = this.assetsService.getAssetName(file.originalname, projectId, "thumbnail");

    const [fileUrl, thumbnailUrl] = await Promise.all([
      this.assetsService.saveFile(file.buffer, file.mimetype, videoAssetName),
      this.assetsService.saveFile(thumbnailFile.buffer, "image/webp", thumbnailAssetName),
    ]);

    return this.capturedVideoRepository.create({
      projectId,
      fileUrl,
      thumbnailUrl,
      durationMs: query.durationMs,
      fileSizeBytes: file.buffer.length,
    });
  }

  public async getCapturedVideos(
    projectId: number,
    page: number = 1,
    limit: number = 20,
    order: "asc" | "desc" = "desc",
  ): Promise<{ data: CapturedVideoEntity[]; total: number }> {
    return this.capturedVideoRepository.getAllByProjectIdPaginated(projectId, page, limit, order);
  }

  public async deleteCapturedVideo(id: number, projectId: number): Promise<void> {
    const video = await this.capturedVideoRepository.getByIdAndProjectIdOrThrow(id, projectId);

    await Promise.all([
      this.assetsService.deleteFile(video.fileUrl),
      this.assetsService.deleteFile(video.thumbnailUrl),
    ]);

    await this.capturedVideoRepository.delete(video.id);
  }
}
