import { createZodDto } from "nestjs-zod";
import { taskDetailSchema, taskSchema, updateTaskSchema } from "@repo/schema";

export class TaskResponse extends createZodDto(taskSchema){}
export class TaskDetailResponse extends createZodDto(taskDetailSchema){}
export class TaskUpdateRequest extends createZodDto(updateTaskSchema){}
