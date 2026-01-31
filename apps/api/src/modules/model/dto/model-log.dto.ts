import { createZodDto } from "nestjs-zod";
import { modelLogSchema } from "@repo/schema";

export class ModelLogResponse extends createZodDto(modelLogSchema){}
