import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

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
  endpoints: (build) => ({}),
  overrideExisting: true,
});

export const {} = trainApi;
