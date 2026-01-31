import { createZodDto } from "nestjs-zod";
import { createLabelSchema, updateLabelSchema, labelSchema } from "@repo/schema";

export class ProjectLabelResponse extends createZodDto(labelSchema){}
export class ProjectLabelCreateRequest extends createZodDto(createLabelSchema){}
export class ProjectLabelUpdateRequest extends createZodDto(updateLabelSchema){}
