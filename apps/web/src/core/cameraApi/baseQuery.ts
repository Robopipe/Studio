import { readCameraApiOverride } from "@/modules/project/utils/cameraApiOverride";
import { RootState } from "@/store";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";
import {
  clearMixedContentWarning,
  isMixedContentScenario,
  notifyMixedContentBlocked,
} from "./mixedContentWarning";

/**
 * Once an HTTP camera request actually succeeds from an HTTPS page, we know
 * the browser is allowing mixed content for this site (the user has granted
 * the permission, or the page's CSP permits it). Any subsequent failure on
 * that URL is therefore not a mixed-content block — it's a real network or
 * camera-side issue, and the mixed-content toast would just be misleading.
 *
 * Flag is module-scoped so it resets on page reload, which is the right
 * boundary: a new tab/session might be loaded in a different browser or
 * profile where the permission no longer applies.
 */
const mixedContentAllowed = new Set<string>();

const mixedContentKey = (baseUrl: string) => baseUrl.toLowerCase();

/**
 * Dynamic base query that resolves the camera API URL from the active project,
 * preferring the current user's local override (localStorage) when set.
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const projectId = state.project.activeProject?.id;
  const userId = state.auth.user?.id;
  const override = readCameraApiOverride(userId, projectId);
  const baseUrl = override ?? state.project.activeProject?.cameraApiUrl ?? "";

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

  const result = await dynamicBaseQuery(args, api, extraOptions);
  const key = mixedContentKey(baseUrl);

  if (isMixedContentScenario(baseUrl)) {
    if (!result.error) {
      // The request succeeded → the browser is clearly not blocking mixed
      // content for this host, so future failures can't be that either.
      // Remember it and clear any previously shown warning.
      if (!mixedContentAllowed.has(key)) {
        mixedContentAllowed.add(key);
        clearMixedContentWarning();
      }
    } else if (
      result.error.status === "FETCH_ERROR" &&
      !mixedContentAllowed.has(key)
    ) {
      notifyMixedContentBlocked(baseUrl);
    }
  }

  return result;
};
