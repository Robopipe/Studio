import { appConfig } from "@/config";
import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  ConfidenceReport,
  ConfidenceReportRegionResponse,
  ConfidenceReportStatusEnum,
  RunConfidenceReport,
  confidenceReportRegionResponseSchema,
  confidenceReportSchema,
} from "@repo/schema";
import { HttpMethod } from "@/types";
import z from "zod";

const { confidenceReport: endpoints } = appConfig.studioApi.endpoints;

export const confidenceReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getConfidenceReport: builder.query<ConfidenceReport, { projectId: number }>({
      query: ({ projectId }) => ({
        url: endpoints.report(projectId),
        method: HttpMethod.GET,
      }),
      transformResponse: (response) => confidenceReportSchema.parse(response),
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.confidenceReport.report, id: projectId },
      ],
      // Poll every 5 s while the job is running or pending.
    }),
    runConfidenceReport: builder.mutation<
      ConfidenceReport,
      { projectId: number } & RunConfidenceReport
    >({
      query: ({ projectId, ...body }) => ({
        url: endpoints.report(projectId),
        method: HttpMethod.POST,
        body,
      }),
      transformResponse: (response) => confidenceReportSchema.parse(response),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.confidenceReport.report, id: projectId },
      ],
    }),
    cancelConfidenceReport: builder.mutation<void, { projectId: number }>({
      query: ({ projectId }) => ({
        url: endpoints.report(projectId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.confidenceReport.report, id: projectId },
      ],
    }),
    getConfidenceReportRegions: builder.query<
      ConfidenceReportRegionResponse[],
      { projectId: number; taskId: number }
    >({
      query: ({ projectId, taskId }) => ({
        url: endpoints.regions(projectId, taskId),
        method: HttpMethod.GET,
      }),
      transformResponse: (response) =>
        z.array(confidenceReportRegionResponseSchema).parse(response),
      providesTags: (_result, _error, { projectId, taskId }) => [
        { type: apiCacheTags.confidenceReport.report, id: `${projectId}-regions-${taskId}` },
      ],
    }),
  }),
});

export const {
  useGetConfidenceReportQuery,
  useRunConfidenceReportMutation,
  useCancelConfidenceReportMutation,
  useGetConfidenceReportRegionsQuery,
} = confidenceReportApi;

/** Polling interval in ms — active while PENDING or RUNNING, else no polling. */
export const CONFIDENCE_REPORT_POLL_MS = 5_000;

export function isReportActive(report: ConfidenceReport | undefined): boolean {
  return (
    report?.status === ConfidenceReportStatusEnum.PENDING ||
    report?.status === ConfidenceReportStatusEnum.RUNNING
  );
}

/**
 * Subscribe to the project's confidence report, polling while a run is
 * active (PENDING/RUNNING) so status transitions — run started, finished,
 * cancelled — propagate to the UI without a page refresh.
 */
export function useConfidenceReport(projectId: number | undefined) {
  const result = useGetConfidenceReportQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );
  // A hook can't derive pollingInterval from its own result, so a second
  // subscription to the same cache entry switches polling on while the
  // report is active — RTK Query polls at the shortest interval among
  // active subscribers.
  useGetConfidenceReportQuery(
    { projectId: projectId! },
    {
      skip: !projectId || !isReportActive(result.data),
      pollingInterval: CONFIDENCE_REPORT_POLL_MS,
    },
  );
  return result;
}
