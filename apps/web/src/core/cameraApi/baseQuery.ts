import { RootState } from "@/store";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";

/**
 * Dynamic base query that resolves camera API URL from Redux state.
 * Priority: activeProject.cameraApiUrl (if non-null) > user.cameraApiUrl
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const projectUrl = state.project.activeProject?.cameraApiUrl;
  const userUrl = state.auth.user?.cameraApiUrl;
  const baseUrl = projectUrl ?? userUrl ?? "";

  const dynamicBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const contentType = headers.get("Content-Type");
      if (!contentType) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  });

  return dynamicBaseQuery(args, api, extraOptions);
};
