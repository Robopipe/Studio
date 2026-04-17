import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CapturedVideo,
  ConfirmTaskUpload,
  ConfirmVideoUpload,
  PaginatedCapturedVideos,
  PaginatedTasks,
  RequestTaskUpload,
  RequestVideoUploadUrls,
  Task,
  TaskExport,
  TaskUploadUrl,
  VideoUploadUrlsResponse,
} from "@repo/schema";

export enum CaptureApiTagType {
  Tasks = "Tasks",
  CapturedVideos = "CapturedVideos",
}

const { tasks, capturedVideos } = appConfig.studioApi.endpoints;
const captureApiBase = createApi({
  reducerPath: "captureApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(CaptureApiTagType),
  endpoints: () => ({}),
});

export const captureApi = captureApiBase.injectEndpoints({
  endpoints: (builder) => ({
    requestTaskUploadUrl: builder.mutation<
      TaskUploadUrl,
      { projectId: number } & RequestTaskUpload
    >({
      query: ({ projectId, ...body }) => ({
        url: tasks.uploadUrl(projectId),
        method: "POST",
        body,
      }),
    }),
    confirmTaskUpload: builder.mutation<
      Task,
      { projectId: number } & ConfirmTaskUpload
    >({
      query: ({ projectId, ...body }) => ({
        url: tasks.confirm(projectId),
        method: "POST",
        body,
      }),
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
          // Confirm failed — user can retry; no optimistic update applied.
        }
      },
    }),
    getTasks: builder.query<
      PaginatedTasks,
      { projectId: number; page?: number; limit?: number; annotated?: string; labelIds?: string; ids?: string; order?: "asc" | "desc" }
    >({
      query: ({ projectId, page = 1, limit = 50, annotated, labelIds, ids, order }) => ({
        url: tasks.tasks(projectId),
        method: HttpMethod.GET,
        params: { page, limit, ...(annotated && { annotated }), ...(labelIds && { labelIds }), ...(ids && { ids }), ...(order && { order }) },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    exportTasks: builder.query<
      TaskExport,
      { projectId: number; annotated?: string; labelIds?: string }
    >({
      query: ({ projectId, annotated, labelIds }) => ({
        url: tasks.export(projectId),
        method: HttpMethod.GET,
        params: {
          ...(annotated && { annotated }),
          ...(labelIds && { labelIds }),
        },
      }),
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
    getCapturedVideo: builder.query<
      CapturedVideo,
      { projectId: number; videoId: number }
    >({
      query: ({ projectId, videoId }) => ({
        url: capturedVideos.single(projectId, videoId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { videoId }) => [
        { type: CaptureApiTagType.CapturedVideos, id: videoId },
      ],
    }),
    getCapturedVideos: builder.query<
      PaginatedCapturedVideos,
      { projectId: number; page?: number; limit?: number; order?: "asc" | "desc" }
    >({
      query: ({ projectId, page = 1, limit = 20, order = "desc" }) => ({
        url: capturedVideos.list(projectId),
        method: HttpMethod.GET,
        params: { page, limit, order },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.CapturedVideos, id: projectId },
      ],
    }),
    requestVideoUploadUrls: builder.mutation<
      VideoUploadUrlsResponse,
      { projectId: number } & RequestVideoUploadUrls
    >({
      query: ({ projectId, ...body }) => ({
        url: capturedVideos.uploadUrl(projectId),
        method: "POST",
        body,
      }),
    }),
    confirmVideoUpload: builder.mutation<
      CapturedVideo,
      { projectId: number } & ConfirmVideoUpload
    >({
      query: ({ projectId, ...body }) => ({
        url: capturedVideos.confirm(projectId),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.CapturedVideos, id: projectId },
      ],
    }),
    deleteCapturedVideo: builder.mutation<void, { projectId: number; videoId: number }>({
      query: ({ projectId, videoId }) => ({
        url: capturedVideos.single(projectId, videoId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.CapturedVideos, id: projectId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useRequestTaskUploadUrlMutation,
  useConfirmTaskUploadMutation,
  useGetTasksQuery,
  useLazyExportTasksQuery,
  useDeleteTaskMutation,
  useRequestVideoUploadUrlsMutation,
  useConfirmVideoUploadMutation,
  useGetCapturedVideosQuery,
  useLazyGetCapturedVideoQuery,
  useDeleteCapturedVideoMutation,
} = captureApi;
