import { createZodDto } from "nestjs-zod";
import { taskDetailSchema, taskSchema } from "@repo/schema";

export class TaskResponse extends createZodDto(taskSchema){}
export class TaskDetailResponse extends createZodDto(taskDetailSchema){}
