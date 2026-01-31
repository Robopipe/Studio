import { appConfig } from "@/config";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";

export const baseQuery = fetchBaseQuery({
  baseUrl: appConfig.cameraApi.baseUrl,
  prepareHeaders: (headers) => {
    const contentType = headers.get("Content-Type");
    if (!contentType) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
});
