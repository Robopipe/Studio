import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateDashboardConfigurationItem,
  DashboardConfigurationItem,
} from "@repo/schema";

export enum DashboardConfigApiTagType {
  DashboardConfigItems = "DashboardConfigItems",
}

const { dashboardConfig } = appConfig.studioApi.endpoints.projects;

export const dashboardConfigApi = createApi({
  reducerPath: "dashboardConfigApi",
  baseQuery: baseQuery,
  tagTypes: Object.values(DashboardConfigApiTagType),
  endpoints: (builder) => ({
    getDashboardConfigItems: builder.query<
      DashboardConfigurationItem[],
      { projectId: number }
    >({
      query: ({ projectId }) => ({
        url: dashboardConfig.items(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigItems, id: projectId },
      ],
    }),
    createDashboardConfigItem: builder.mutation<
      DashboardConfigurationItem,
      CreateDashboardConfigurationItem & { projectId: number }
    >({
      query: ({ projectId, ...body }) => ({
        url: dashboardConfig.items(projectId),
        method: HttpMethod.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigItems, id: projectId },
      ],
    }),
    updateDashboardConfigItem: builder.mutation<
      DashboardConfigurationItem,
      CreateDashboardConfigurationItem & { projectId: number; itemId: number }
    >({
      query: ({ projectId, itemId, ...body }) => ({
        url: dashboardConfig.item(projectId, itemId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigItems, id: projectId },
      ],
    }),
    deleteDashboardConfigItem: builder.mutation<
      void,
      { projectId: number; itemId: number }
    >({
      query: ({ projectId, itemId }) => ({
        url: dashboardConfig.item(projectId, itemId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: DashboardConfigApiTagType.DashboardConfigItems, id: projectId },
      ],
    }),
  }),
});

export const {
  useGetDashboardConfigItemsQuery,
  useCreateDashboardConfigItemMutation,
  useUpdateDashboardConfigItemMutation,
  useDeleteDashboardConfigItemMutation,
} = dashboardConfigApi;
