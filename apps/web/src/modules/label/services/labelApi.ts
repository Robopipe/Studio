import { appConfig } from "@/config";
import { HttpMethod } from "@/types";
import { TaskDetail, UpdateTask } from "@repo/schema";
import { captureApi, CaptureApiTagType } from "@/modules/capture/services/captureApi";

const { tasks } = appConfig.studioApi.endpoints;

export const labelApi = captureApi.injectEndpoints({
  endpoints: (builder) => ({
    getTask: builder.query<TaskDetail, { projectId: number; taskId: number }>({
      query: ({ projectId, taskId }) => ({
        url: tasks.task(projectId, taskId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: CaptureApiTagType.Tasks, id: `detail-${taskId}` },
      ],
    }),
    updateTask: builder.mutation<
      TaskDetail,
      { projectId: number; taskId: number; body: UpdateTask }
    >({
      query: ({ projectId, taskId, body }) => ({
        url: tasks.task(projectId, taskId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, taskId }) => [
        { type: CaptureApiTagType.Tasks, id: projectId },
        { type: CaptureApiTagType.Tasks, id: `detail-${taskId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetTaskQuery, useUpdateTaskMutation } = labelApi;
