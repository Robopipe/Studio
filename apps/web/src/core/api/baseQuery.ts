import { appConfig } from "@/config";
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Token } from "@repo/schema";
import { clearCredentials, setCredentials } from "../auth/services/authActions";
import { ACCESS_TOKEN_KEY } from "./constants";

export const baseQuery = fetchBaseQuery({
  baseUrl: appConfig.studioApi.baseUrl,
  prepareHeaders: (headers) => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const contentType = headers.get("Content-Type");
    if (!contentType) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
  credentials: "include",
});

export const baseRefreshingQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      { url: appConfig.studioApi.endpoints.auth.refreshToken, method: "POST" },
      api,
      extraOptions,
    );
    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data as Token));
      return baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};
