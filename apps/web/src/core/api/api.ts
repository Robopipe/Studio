import { createApi } from "@reduxjs/toolkit/query";
import { baseRefreshingQuery } from "./baseQuery";

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseRefreshingQuery,
  tagTypes: [],
  endpoints: () => ({}),
});
