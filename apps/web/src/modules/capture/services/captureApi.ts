import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { PaginatedTasks, Task } from "@repo/schema";

export enum CaptureApiTagType {
  Tasks = "Tasks",
}

const { tasks } = appConfig.studioApi.endpoints;
const captureApiBase = createApi({
  reducerPath: "captureApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(CaptureApiTagType),
  endpoints: () => ({}),
});

export const captureApi = captureApiBase.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation<Task, { file: File; projectId: number }>({
      query: ({ file, projectId }) => {
        var bodyFormData = new FormData();
        bodyFormData.append("file", file);

        return {
          url: tasks.tasks(projectId),
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: bodyFormData,
          formData: true,
        };
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    getTasks: builder.query<
      PaginatedTasks,
      { projectId: number; page?: number; limit?: number; annotated?: string }
    >({
      query: ({ projectId, page = 1, limit = 50, annotated }) => ({
        url: tasks.tasks(projectId),
        method: HttpMethod.GET,
        params: { page, limit, ...(annotated && { annotated }) },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    deleteTask: builder.mutation<void, { projectId: number; taskId: number }>({
      query: ({ projectId, taskId }) => ({
        url: tasks.task(projectId, taskId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateTaskMutation,
  useGetTasksQuery,
  useDeleteTaskMutation,
} = captureApi;
