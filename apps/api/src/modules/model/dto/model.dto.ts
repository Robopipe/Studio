import { createZodDto } from "nestjs-zod";
import {
  createModelSchema,
  updateModelSchema,
  modelSchema,
} from "@repo/schema";

export class ModelCreateRequest extends createZodDto(createModelSchema){}
export class ModelUpdateRequest extends createZodDto(updateModelSchema) {}
export class ModelResponse extends createZodDto(modelSchema){}
