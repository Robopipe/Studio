import { createZodDto } from "nestjs-zod";
import {
  confirmTaskUploadSchema,
  importedSourceTaskIdsQuerySchema,
  importedSourceTaskIdsResponseSchema,
  importTasksResponseSchema,
  importTasksSchema,
  paginatedTaskSchema,
  requestTaskUploadSchema,
  taskDetailSchema,
  taskExportQuerySchema,
  taskExportSchema,
  taskHistoryResponseSchema,
  taskIdsQuerySchema,
  taskIdsResponseSchema,
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
export class ImportTasksDto extends createZodDto(importTasksSchema){}
export class ImportTasksResponseDto extends createZodDto(importTasksResponseSchema){}
export class ImportedSourceTaskIdsQueryDto extends createZodDto(importedSourceTaskIdsQuerySchema){}
export class ImportedSourceTaskIdsResponseDto extends createZodDto(importedSourceTaskIdsResponseSchema){}
export class TaskExportQuery extends createZodDto(taskExportQuerySchema){}
export class TaskExportResponse extends createZodDto(taskExportSchema){}
export class TaskIdsQuery extends createZodDto(taskIdsQuerySchema){}
export class TaskIdsResponseDto extends createZodDto(taskIdsResponseSchema){}
export class TaskHistoryResponse extends createZodDto(taskHistoryResponseSchema){}
