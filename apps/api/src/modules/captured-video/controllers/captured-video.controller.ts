import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CapturedVideoService } from "../services/captured-video.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  CapturedVideoResponse,
  CapturedVideoPaginationQuery,
  PaginatedCapturedVideoResponse,
  RequestVideoUploadUrlsBody,
  ConfirmVideoUploadBody,
} from "../dto/captured-video.dto";
import { VideoUploadUrlsResponse } from "@repo/schema";

@Controller("captured-video/:projectId")
@UseGuards(ProjectGuard)
export class CapturedVideoController {
  constructor(private readonly capturedVideoService: CapturedVideoService) {}

  @Post("upload-url")
  public async getUploadUrls(
    @ProjectId() projectId: number,
    @Body() body: RequestVideoUploadUrlsBody,
  ): Promise<VideoUploadUrlsResponse> {
    return this.capturedVideoService.generateUploadUrls(projectId, body);
  }

  @Post("confirm")
  public async confirmUpload(
    @ProjectId() projectId: number,
    @Body() body: ConfirmVideoUploadBody,
  ): Promise<CapturedVideoResponse> {
    const video = await this.capturedVideoService.confirmUpload(projectId, body);
    return video.toResponse();
  }

  @Get(":videoId")
  public async getById(
    @ProjectId() projectId: number,
    @Param("videoId", ParseIntPipe) videoId: number,
  ): Promise<CapturedVideoResponse> {
    const video = await this.capturedVideoService.getCapturedVideoById(videoId, projectId);
    return video.toResponse();
  }

  @Get()
  public async list(
    @ProjectId() projectId: number,
    @Query() query: CapturedVideoPaginationQuery,
  ): Promise<PaginatedCapturedVideoResponse> {
    const { data, total } = await this.capturedVideoService.getCapturedVideos(
      projectId,
      query.page,
      query.limit,
      query.order,
    );
    return {
      data: data.map((v) => v.toResponse()),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Delete(":videoId")
  public async delete(
    @ProjectId() projectId: number,
    @Param("videoId", ParseIntPipe) videoId: number,
  ): Promise<void> {
    await this.capturedVideoService.deleteCapturedVideo(videoId, projectId);
  }
}
