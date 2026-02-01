import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { CreateModel, Model } from "@repo/schema";

export enum TrainApiTagType {
  Model = "Models",
}

const { models } = appConfig.studioApi.endpoints;
const trainApiBase = createApi({
  reducerPath: "",
  baseQuery: baseQuery,
  tagTypes: Object.values(TrainApiTagType),
  endpoints: () => ({}),
});

export const trainApi = trainApiBase.injectEndpoints({
  endpoints: (builder) => ({
    getModels: builder.query<Model[], { projectId: number }>({
      query: ({ projectId }) => ({
        url: models.models(projectId),
        method: HttpMethod.GET,
      }),
    }),
    getModel: builder.query<Model, { projectId: number; modelId: number }>({
      query: ({ projectId, modelId }) => ({
        url: `${models.models(projectId)}/${modelId}`,
        method: HttpMethod.GET,
      }),
    }),
    createModel: builder.mutation<Model, CreateModel & { projectId: number }>({
      query: ({ projectId, ...payload }) => ({
        url: models.models(projectId),
        method: HttpMethod.POST,
        body: payload,
      }),
    }),
    deleteModel: builder.mutation<void, { projectId: number; modelId: number }>(
      {
        query: ({ projectId, modelId }) => ({
          url: `${models.models(projectId)}/${modelId}`,
          method: HttpMethod.DELETE,
        }),
        invalidatesTags: (_result, _error) => [{ type: TrainApiTagType.Model }],
      },
    ),
    trainModel: builder.mutation<void, { projectId: number; modelId: number }>({
      query: ({ projectId, modelId }) => ({
        url: `${models.models(projectId)}/${modelId}/train`,
        method: HttpMethod.POST,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {} = trainApi;
