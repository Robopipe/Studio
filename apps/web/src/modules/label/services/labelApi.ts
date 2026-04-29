import { appConfig } from "@/config";
import { HttpMethod } from "@/types";
import { PredictRequest, PredictResponse, TaskDetail, UpdateTask } from "@repo/schema";
import { captureApi, CaptureApiTagType } from "@/modules/capture/services/captureApi";

const { tasks, predict } = appConfig.studioApi.endpoints;

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
    predictAnnotations: builder.mutation<
      PredictResponse,
      { projectId: number; taskId: number; body: PredictRequest }
    >({
      query: ({ projectId, taskId, body }) => ({
        url: predict.predict(projectId, taskId),
        method: HttpMethod.POST,
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTaskQuery,
  useUpdateTaskMutation,
  usePredictAnnotationsMutation,
} = labelApi;
