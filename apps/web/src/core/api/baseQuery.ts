import { appConfig } from "@/config";
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { PreAuthToken, Token } from "@repo/schema";
import { clearCredentials, setCredentials, setPreAuthCredentials } from "../auth/services/authActions";
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

let refreshPromise: Promise<boolean> | null = null;

export const baseRefreshingQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (
    result.error &&
    result.error.status === 401 &&
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  ) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshResult = await baseQuery(
          {
            url: appConfig.studioApi.endpoints.auth.refreshToken,
            method: "POST",
          },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          const data = refreshResult.data as Token | PreAuthToken;
          if ('organization' in data) {
            api.dispatch(setCredentials(data as Token));
          } else {
            api.dispatch(setPreAuthCredentials(data as PreAuthToken));
          }
          return true;
        } else {
          api.dispatch(clearCredentials());
          return false;
        }
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshSuccess = await refreshPromise;
    if (refreshSuccess) {
      return baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
