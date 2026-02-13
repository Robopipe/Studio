import { createZodDto } from "nestjs-zod";
import { createTaskSchema, paginatedTaskSchema, taskDetailSchema, taskPaginationQuerySchema, taskSchema, updateTaskSchema } from "@repo/schema";

export class CreateTaskQuery extends createZodDto(createTaskSchema){}
export class TaskResponse extends createZodDto(taskSchema){}
export class TaskDetailResponse extends createZodDto(taskDetailSchema){}
export class TaskUpdateRequest extends createZodDto(updateTaskSchema){}
export class TaskPaginationQuery extends createZodDto(taskPaginationQuerySchema){}
export class PaginatedTaskResponse extends createZodDto(paginatedTaskSchema){}
