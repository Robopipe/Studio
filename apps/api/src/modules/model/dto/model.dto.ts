import { createZodDto } from "nestjs-zod";
import {
  createModelSchema,
  datasetStatsResponseSchema,
  datasetStatsSchema,
  modelSchema,
  updateModelSchema,
} from "@repo/schema";

export class ModelCreateRequest extends createZodDto(createModelSchema){}
export class ModelUpdateRequest extends createZodDto(updateModelSchema) {}
export class ModelResponse extends createZodDto(modelSchema){}
export class DatasetStatsRequest extends createZodDto(datasetStatsSchema) {}
export class DatasetStatsResponse extends createZodDto(datasetStatsResponseSchema) {}
