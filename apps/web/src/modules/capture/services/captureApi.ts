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
    createTask: builder.mutation<Task, { file: File; projectId: number; capturedAt: string }>({
      query: ({ file, projectId, capturedAt }) => {
        var bodyFormData = new FormData();
        bodyFormData.append("file", file);

        return {
          url: tasks.tasks(projectId),
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: { capturedAt },
          body: bodyFormData,
          formData: true,
        };
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
      onQueryStarted: async ({ projectId }, { dispatch, queryFulfilled }) => {
        try {
          const { data: newTask } = await queryFulfilled;
          dispatch(
            captureApi.util.updateQueryData(
              "getTasks",
              { projectId, page: 1, limit: 50, order: "desc" },
              (draft) => {
                draft.data.unshift(newTask);
                draft.total += 1;
                if (draft.data.length > draft.limit) {
                  draft.data.pop();
                }
              },
            ),
          );
        } catch {
          // Mutation failed — invalidatesTags won't fire either
        }
      },
    }),
    getTasks: builder.query<
      PaginatedTasks,
      { projectId: number; page?: number; limit?: number; annotated?: string; order?: "asc" | "desc" }
    >({
      query: ({ projectId, page = 1, limit = 50, annotated, order }) => ({
        url: tasks.tasks(projectId),
        method: HttpMethod.GET,
        params: { page, limit, ...(annotated && { annotated }), ...(order && { order }) },
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
