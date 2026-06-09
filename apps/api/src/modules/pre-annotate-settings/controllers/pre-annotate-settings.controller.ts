import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { PreAnnotateModelTypeEnum, PreAnnotateSettings } from "@repo/schema";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { PreAnnotateSettingsDto } from "../dto/pre-annotate-settings.dto";
import { PreAnnotateSettingsService } from "../services/pre-annotate-settings.service";

const VALID_MODEL_TYPES = new Set<string>(Object.values(PreAnnotateModelTypeEnum));

function parseModelType(raw: string): PreAnnotateModelTypeEnum {
  if (!VALID_MODEL_TYPES.has(raw)) {
    throw new BadRequestException(
      `Invalid modelType "${raw}". Valid values: ${[...VALID_MODEL_TYPES].join(", ")}`,
    );
  }
  return raw as PreAnnotateModelTypeEnum;
}

@Controller("projects/:projectId/pre-annotate-settings")
@UseGuards(ProjectGuard)
export class PreAnnotateSettingsController {
  constructor(private readonly service: PreAnnotateSettingsService) {}

  @Get(":modelType")
  public async get(
    @ProjectId() projectId: number,
    @Param("modelType") rawModelType: string,
  ): Promise<PreAnnotateSettings | null> {
    return this.service.get(projectId, parseModelType(rawModelType));
  }

  @Put(":modelType")
  public async upsert(
    @ProjectId() projectId: number,
    @Param("modelType") rawModelType: string,
    @Body() body: PreAnnotateSettingsDto,
  ): Promise<PreAnnotateSettings> {
    const modelType = parseModelType(rawModelType);
    if (body.modelType !== modelType) {
      throw new BadRequestException(
        "Path modelType must match body modelType",
      );
    }
    return this.service.upsert(projectId, modelType, body);
  }
}
