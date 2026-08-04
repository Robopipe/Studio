import { createZodDto } from "nestjs-zod";
import {
  runConfigurationSchema,
  updateRunConfigurationSchema,
} from "@repo/schema";

export class RunConfigurationResponse extends createZodDto(runConfigurationSchema) {}
export class RunConfigurationUpdateRequest extends createZodDto(updateRunConfigurationSchema) {}
