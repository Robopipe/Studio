import { BadRequestException, Injectable } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { CapturedVideoRepository } from "../../../repository/services/captured-video-repository.service";
import { CapturedVideoEntity } from "../entity/captured-video.entity";
import { ConfirmVideoUpload, RequestVideoUploadUrls, VideoUploadUrlsResponse } from "@repo/schema";

@Injectable()
export class CapturedVideoService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly capturedVideoRepository: CapturedVideoRepository,
  ) {}

  public async getCapturedVideos(
    projectId: number,
    page: number = 1,
    limit: number = 20,
    order: "asc" | "desc" = "desc",
  ): Promise<{ data: CapturedVideoEntity[]; total: number }> {
    return this.capturedVideoRepository.getAllByProjectIdPaginated(projectId, page, limit, order);
  }

  public async generateUploadUrls(
    projectId: number,
    request: RequestVideoUploadUrls,
  ): Promise<VideoUploadUrlsResponse> {
    const videoGcsPath = this.assetsService.getAssetName(request.videoFileName, projectId, "video");
    const thumbnailGcsPath = this.assetsService.getAssetName(request.thumbnailFileName, projectId, "thumbnail");

    const [videoSignedUrl, thumbnailSignedUrl] = await Promise.all([
      this.assetsService.generateSignedUploadUrl(videoGcsPath, request.videoContentType),
      this.assetsService.generateSignedUploadUrl(thumbnailGcsPath, request.thumbnailContentType),
    ]);

    return { videoSignedUrl, videoGcsPath, thumbnailSignedUrl, thumbnailGcsPath };
  }

  public async confirmUpload(
    projectId: number,
    data: ConfirmVideoUpload,
  ): Promise<CapturedVideoEntity> {
    const [videoExists, thumbnailExists] = await Promise.all([
      this.assetsService.fileExists(data.videoGcsPath),
      this.assetsService.fileExists(data.thumbnailGcsPath),
    ]);

    if (!videoExists || !thumbnailExists) {
      throw new BadRequestException("Uploaded files not found in storage");
    }

    const [fileUrl, thumbnailUrl] = await Promise.all([
      this.assetsService.makeFilePublic(data.videoGcsPath),
      this.assetsService.makeFilePublic(data.thumbnailGcsPath),
    ]);

    return this.capturedVideoRepository.create({
      projectId,
      fileUrl,
      thumbnailUrl,
      durationMs: data.durationMs,
      fileSizeBytes: data.fileSizeBytes,
    });
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
