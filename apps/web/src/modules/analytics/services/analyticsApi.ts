import { appConfig } from "@/config";
import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import { AnalyticsDatasetStats, analyticsDatasetStatsSchema } from "@repo/schema";

const { analytics } = appConfig.studioApi.endpoints;

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDatasetStats: builder.query<
      AnalyticsDatasetStats,
      { projectId: number; types: string }
    >({
      query: ({ projectId, types }) =>
        `${analytics.datasetStats(projectId)}?types=${types}`,
      transformResponse: (response) => analyticsDatasetStatsSchema.parse(response),
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.analytics.datasetStats, id: projectId },
      ],
    }),
  }),
});

export const { useGetDatasetStatsQuery } = analyticsApi;
