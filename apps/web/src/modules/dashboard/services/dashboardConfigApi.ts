import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateDashboardConfiguration,
  DashboardConfiguration,
  DashboardEvaluation,
  UpsertDashboardEvaluation,
} from "@repo/schema";

export enum DashboardConfigApiTagType {
  DashboardConfigs = "DashboardConfigs",
  DashboardEvaluation = "DashboardEvaluation",
}

const { dashboardConfig } = appConfig.studioApi.endpoints.projects;

export const dashboardConfigApi = createApi({
  reducerPath: "dashboardConfigApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(DashboardConfigApiTagType),
  endpoints: (builder) => ({
    // --- Dashboard Configuration endpoints ---
    getDashboardConfigs: builder.query<
      DashboardConfiguration[],
      { projectId: number }
    >({
      query: ({ projectId }) => ({
        url: dashboardConfig.configurations(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigs, id: projectId },
      ],
    }),
    getDashboardConfig: builder.query<
      DashboardConfiguration,
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) => ({
        url: dashboardConfig.configuration(projectId, configId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { configId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigs, id: configId },
      ],
    }),
    createDashboardConfig: builder.mutation<
      DashboardConfiguration,
      CreateDashboardConfiguration & { projectId: number }
    >({
      query: ({ projectId, ...body }) => ({
        url: dashboardConfig.configurations(projectId),
        method: HttpMethod.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigs, id: projectId },
      ],
    }),
    updateDashboardConfig: builder.mutation<
      DashboardConfiguration,
      CreateDashboardConfiguration & { projectId: number; configId: number }
    >({
      query: ({ projectId, configId, ...body }) => ({
        url: dashboardConfig.configuration(projectId, configId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigs, id: projectId },
      ],
    }),
    deleteDashboardConfig: builder.mutation<
      void,
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) => ({
        url: dashboardConfig.configuration(projectId, configId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigs, id: projectId },
      ],
    }),

    // --- Dashboard Evaluation endpoints ---
    getDashboardEvaluation: builder.query<
      DashboardEvaluation | null,
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) => ({
        url: dashboardConfig.evaluation(projectId, configId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { configId }) => [
        { type: DashboardConfigApiTagType.DashboardEvaluation, id: configId },
      ],
    }),
    upsertDashboardEvaluation: builder.mutation<
      DashboardEvaluation,
      UpsertDashboardEvaluation & { projectId: number; configId: number }
    >({
      query: ({ projectId, configId, ...body }) => ({
        url: dashboardConfig.evaluation(projectId, configId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: DashboardConfigApiTagType.DashboardEvaluation, id: configId },
      ],
    }),
  }),
});

export const {
  useGetDashboardConfigsQuery,
  useGetDashboardConfigQuery,
  useCreateDashboardConfigMutation,
  useUpdateDashboardConfigMutation,
  useDeleteDashboardConfigMutation,
  useGetDashboardEvaluationQuery,
  useUpsertDashboardEvaluationMutation,
} = dashboardConfigApi;
