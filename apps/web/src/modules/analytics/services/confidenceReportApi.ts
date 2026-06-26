import { appConfig } from "@/config";
import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  ConfidenceReport,
  ConfidenceReportStatusEnum,
  RunConfidenceReport,
  confidenceReportSchema,
} from "@repo/schema";
import { HttpMethod } from "@/types";

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
  }),
});

export const {
  useGetConfidenceReportQuery,
  useRunConfidenceReportMutation,
  useCancelConfidenceReportMutation,
} = confidenceReportApi;

/** Polling interval in ms — active while PENDING or RUNNING, else no polling. */
export const CONFIDENCE_REPORT_POLL_MS = 5_000;

export function isReportActive(report: ConfidenceReport | undefined): boolean {
  return (
    report?.status === ConfidenceReportStatusEnum.PENDING ||
    report?.status === ConfidenceReportStatusEnum.RUNNING
  );
}
