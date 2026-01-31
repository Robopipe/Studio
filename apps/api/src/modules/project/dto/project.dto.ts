import { createZodDto } from "nestjs-zod";
import { projectSchema, projectListResponseSchema } from "@repo/schema";

export class ProjectResponse extends createZodDto(projectSchema){}
export class ProjectListResponse extends createZodDto(projectListResponseSchema){}
