import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { Login, Token, User } from "@repo/schema";

const { auth } = appConfig.studioApi.endpoints;
const authApiBase = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export const authApi = authApiBase.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<Token, Login>({
      query: ({ email, password }) => ({
        url: auth.login,
        method: HttpMethod.POST,
        body: { email, password },
      }),
    }),
    refreshTokens: builder.mutation<Token, void>({
      query: () => ({
        url: auth.refreshToken,
        method: HttpMethod.POST,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: auth.logout,
        method: HttpMethod.POST,
      }),
    }),
    profile: builder.query<User, void>({
      query: () => ({
        url: auth.profile,
        method: HttpMethod.GET,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginMutation,
  useRefreshTokensMutation,
  useLogoutMutation,
  useProfileQuery,
} = authApi;
