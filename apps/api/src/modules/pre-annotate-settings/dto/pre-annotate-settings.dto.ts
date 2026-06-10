import { createZodDto } from "nestjs-zod";
import { preAnnotateSettingsSchema } from "@repo/schema";

export class PreAnnotateSettingsDto extends createZodDto(preAnnotateSettingsSchema) {}
