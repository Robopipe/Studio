import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateModel,
  Model,
  ModelLog,
  ModelOutput,
} from "@repo/schema";

export enum ModelApiTagType {
  Model = "Models",
}

const { projects } = appConfig.studioApi.endpoints;
const modelApiBase = createApi({
  reducerPath: "modelApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(ModelApiTagType),
  endpoints: () => ({}),
});

export const modelApi = modelApiBase.injectEndpoints({
  endpoints: (builder) => ({
    getModels: builder.query<Model[], { projectId: number }>({
      query: ({ projectId }) => ({
        url: projects.models.models(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: ModelApiTagType.Model, id: projectId },
      ],
    }),
    getModel: builder.query<Model, { projectId: number; modelId: number }>({
      query: ({ projectId, modelId }) => ({
        url: `${projects.models.models(projectId)}/${modelId}`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: ModelApiTagType.Model, id: projectId },
      ],
    }),
    createModel: builder.mutation<Model, CreateModel & { projectId: number }>({
      query: ({ projectId, ...payload }) => ({
        url: projects.models.models(projectId),
        method: HttpMethod.POST,
        body: payload,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: ModelApiTagType.Model, id: projectId },
      ],
    }),
    deleteModel: builder.mutation<void, { projectId: number; modelId: number }>(
      {
        query: ({ projectId, modelId }) => ({
          url: `${projects.models.models(projectId)}/${modelId}`,
          method: HttpMethod.DELETE,
        }),
        invalidatesTags: (_result, _error, { projectId }) => [
          { type: ModelApiTagType.Model, id: projectId },
        ],
      },
    ),
    trainModel: builder.mutation<void, { projectId: number; modelId: number }>({
      query: ({ projectId, modelId }) => ({
        url: `${projects.models.models(projectId)}/${modelId}/train`,
        method: HttpMethod.POST,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: ModelApiTagType.Model, id: projectId },
      ],
    }),
    getModelLogs: builder.query<
      ModelLog[],
      { projectId: number; modelId: number }
    >({
      query: ({ projectId, modelId }) => ({
        url: `${projects.models.models(projectId)}/${modelId}/logs`,
        method: HttpMethod.GET,
      }),
    }),
    getModelOutputs: builder.query<
      ModelOutput[],
      { projectId: number; modelId: number }
    >({
      query: ({ projectId, modelId }) => ({
        url: `${projects.models.models(projectId)}/${modelId}/outputs`,
        method: HttpMethod.GET,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateModelMutation,
  useTrainModelMutation,
  useGetModelsQuery,
  useGetModelQuery,
  useDeleteModelMutation,
  useGetModelLogsQuery,
  useGetModelOutputsQuery,
} = modelApi;
