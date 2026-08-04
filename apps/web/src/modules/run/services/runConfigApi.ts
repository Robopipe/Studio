import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { RunConfiguration, UpdateRunConfiguration } from "@repo/schema";

export enum RunConfigApiTagType {
  RunConfig = "RunConfig",
}

const { runConfig } = appConfig.studioApi.endpoints.projects;

export const runConfigApi = createApi({
  reducerPath: "runConfigApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(RunConfigApiTagType),
  endpoints: (builder) => ({
    getRunConfig: builder.query<RunConfiguration, { projectId: number }>({
      query: ({ projectId }) => ({
        url: runConfig(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: RunConfigApiTagType.RunConfig, id: projectId },
      ],
    }),
    updateRunConfig: builder.mutation<
      RunConfiguration,
      UpdateRunConfiguration & { projectId: number }
    >({
      query: ({ projectId, ...body }) => ({
        url: runConfig(projectId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: RunConfigApiTagType.RunConfig, id: projectId },
      ],
    }),
  }),
});

export const { useGetRunConfigQuery, useUpdateRunConfigMutation } =
  runConfigApi;
