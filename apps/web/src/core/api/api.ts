import { baseRefreshingQuery } from "./baseQuery";
import { extractValuesFromObject } from "@/utils";
import { apiCacheTags } from "./tags";
import { createApi } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseRefreshingQuery,
  tagTypes: extractValuesFromObject(apiCacheTags),
  endpoints: () => ({}),
});
