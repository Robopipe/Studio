import { createZodDto } from "nestjs-zod";
import {
  projectSchema,
  projectListResponseSchema,
  createProjectRequestSchema,
  updateProjectRequestSchema,
} from "@repo/schema";

export class ProjectResponse extends createZodDto(projectSchema){}
export class ProjectListResponse extends createZodDto(projectListResponseSchema){}
export class ProjectCreateRequest extends createZodDto(createProjectRequestSchema){}
export class ProjectUpdateRequest extends createZodDto(updateProjectRequestSchema){}
