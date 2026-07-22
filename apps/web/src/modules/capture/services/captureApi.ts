import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CapturedVideo,
  ConfirmTaskUpload,
  ConfirmVideoUpload,
  ImportedEventIdsResponse,
  ImportedSourceTaskIdsResponse,
  ImportTasks,
  ImportTasksResponse,
  PaginatedCapturedVideos,
  PaginatedTasks,
  RequestTaskUploadInput,
  RequestVideoUploadUrls,
  Task,
  TaskExport,
  TaskIdsResponse,
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
      { projectId: number } & RequestTaskUploadInput
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
              { projectId, page: 1, limit: 50, sortOrder: "desc" },
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
      { projectId: number; page?: number; limit?: number; annotated?: string; labelIds?: string; ids?: string; sortBy?: string; sortOrder?: "asc" | "desc"; updatedBy?: string }
    >({
      query: ({ projectId, page = 1, limit = 50, annotated, labelIds, ids, sortBy, sortOrder, updatedBy }) => ({
        url: tasks.tasks(projectId),
        method: HttpMethod.GET,
        params: { page, limit, ...(annotated && { annotated }), ...(labelIds && { labelIds }), ...(ids && { ids }), ...(sortBy && { sortBy }), ...(sortOrder && { sortOrder }), ...(updatedBy && { updatedBy }) },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    getTaskIds: builder.query<
      TaskIdsResponse,
      { projectId: number; annotated?: string; labelIds?: string; sortBy?: string; sortOrder?: "asc" | "desc" }
    >({
      query: ({ projectId, annotated, labelIds, sortBy, sortOrder }) => ({
        url: tasks.ids(projectId),
        method: HttpMethod.GET,
        params: {
          ...(annotated && { annotated }),
          ...(labelIds && { labelIds }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    getImportedEvents: builder.query<
      ImportedEventIdsResponse,
      { projectId: number; dashboardId: number; eventIds: number[] }
    >({
      query: ({ projectId, dashboardId, eventIds }) => ({
        url: tasks.importedEvents(projectId),
        method: HttpMethod.GET,
        params: { dashboardId, eventIds: eventIds.join(",") },
      }),
      // Provided under the Tasks tag so deleteTask invalidation re-enables
      // the reports "save to dataset" button after a dataset delete.
      providesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    importTasks: builder.mutation<
      ImportTasksResponse,
      { projectId: number } & ImportTasks
    >({
      query: ({ projectId, ...body }) => ({
        url: tasks.import(projectId),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
      ],
    }),
    getImportedSourceTaskIds: builder.query<
      ImportedSourceTaskIdsResponse,
      { projectId: number; sourceProjectId: number }
    >({
      query: ({ projectId, sourceProjectId }) => ({
        url: tasks.importedSourceTasks(projectId),
        method: HttpMethod.GET,
        params: { sourceProjectId },
      }),
      // Provided under the target project's Tasks tag so a successful import
      // or a dataset delete refreshes the picker's "already imported" state.
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
  useLazyGetTasksQuery,
  useGetTaskIdsQuery,
  useGetImportedEventsQuery,
  useImportTasksMutation,
  useGetImportedSourceTaskIdsQuery,
  useLazyExportTasksQuery,
  useDeleteTaskMutation,
  useRequestVideoUploadUrlsMutation,
  useConfirmVideoUploadMutation,
  useGetCapturedVideosQuery,
  useLazyGetCapturedVideoQuery,
  useDeleteCapturedVideoMutation,
} = captureApi;
