import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  ForgotPassword,
  Login,
  Register,
  ResetPassword,
  Token,
  UpdateUserRequest,
  User,
} from "@repo/schema";

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
    register: builder.mutation<Token, Register>({
      query: (data) => ({
        url: auth.register,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    updateProfile: builder.mutation<User, UpdateUserRequest>({
      query: (data) => ({
        url: auth.profile,
        method: HttpMethod.PUT,
        body: data,
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPassword>({
      query: (data) => ({
        url: auth.forgotPassword,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPassword>({
      query: (data) => ({
        url: auth.resetPassword,
        method: HttpMethod.POST,
        body: data,
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
  useRegisterMutation,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
