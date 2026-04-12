import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { CapturedVideoService } from "../services/captured-video.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  CapturedVideoResponse,
  CreateCapturedVideoQuery,
  CapturedVideoPaginationQuery,
  PaginatedCapturedVideoResponse,
} from "../dto/captured-video.dto";

@Controller("captured-video/:projectId")
@UseGuards(ProjectGuard)
export class CapturedVideoController {
  constructor(private readonly capturedVideoService: CapturedVideoService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "file", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
  )
  public async create(
    @ProjectId() projectId: number,
    @UploadedFiles() files: { file?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Query() query: CreateCapturedVideoQuery,
  ): Promise<CapturedVideoResponse> {
    const file = files.file?.[0];
    const thumbnail = files.thumbnail?.[0];

    if (!file || !thumbnail) {
      throw new Error("Both file and thumbnail are required");
    }

    const video = await this.capturedVideoService.createCapturedVideo(projectId, file, thumbnail, query);
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
