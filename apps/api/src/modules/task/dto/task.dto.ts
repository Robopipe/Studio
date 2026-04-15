import { createZodDto } from "nestjs-zod";
import {
  confirmTaskUploadSchema,
  paginatedTaskSchema,
  requestTaskUploadSchema,
  taskDetailSchema,
  taskExportQuerySchema,
  taskExportSchema,
  taskPaginationQuerySchema,
  taskSchema,
  taskUploadUrlSchema,
  updateTaskSchema,
} from "@repo/schema";

export class TaskResponse extends createZodDto(taskSchema){}
export class TaskDetailResponse extends createZodDto(taskDetailSchema){}
export class TaskUpdateRequest extends createZodDto(updateTaskSchema){}
export class TaskPaginationQuery extends createZodDto(taskPaginationQuerySchema){}
export class PaginatedTaskResponse extends createZodDto(paginatedTaskSchema){}
export class RequestTaskUploadDto extends createZodDto(requestTaskUploadSchema){}
export class TaskUploadUrlResponse extends createZodDto(taskUploadUrlSchema){}
export class ConfirmTaskUploadDto extends createZodDto(confirmTaskUploadSchema){}
export class TaskExportQuery extends createZodDto(taskExportQuerySchema){}
export class TaskExportResponse extends createZodDto(taskExportSchema){}
