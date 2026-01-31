import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { Task } from "@repo/schema";

export enum CaptureApiTagType {
  Tasks = "Tasks",
}

const { tasks } = appConfig.studioApi.endpoints;
const captureApiBase = createApi({
  reducerPath: "captureApi",
  baseQuery: baseQuery,
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
    getTasks: builder.query<Task[], { projectId: number }>({
      query: ({ projectId }) => ({
        url: tasks.tasks(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateTaskMutation, useGetTasksQuery } = captureApi;
