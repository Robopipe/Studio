import { appConfig } from "@/config";
import { baseQuery, baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import {
  ForgotPassword,
  Invitation,
  Login,
  OrganizationListItem,
  PreAuthToken,
  Register,
  ResetPassword,
  SelectOrganization,
  Token,
  UpdateUserRequest,
  User,
} from "@repo/schema";

const { auth } = appConfig.studioApi.endpoints;
const authApiBase = createApi({
  reducerPath: "authApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: ["Organizations", "Invitations"],
  endpoints: () => ({}),
});

export const authApi = authApiBase.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<PreAuthToken, Login>({
      query: ({ email, password }) => ({
        url: auth.login,
        method: HttpMethod.POST,
        body: { email, password },
      }),
    }),
    register: builder.mutation<{ message: string }, Register>({
      query: (data) => ({
        url: auth.register,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    selectOrganization: builder.mutation<Token, SelectOrganization>({
      query: (data) => ({
        url: auth.selectOrganization,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    switchOrganization: builder.mutation<Token, SelectOrganization>({
      query: (data) => ({
        url: auth.switchOrganization,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    listOrganizations: builder.query<OrganizationListItem[], void>({
      query: () => ({
        url: auth.organizations,
        method: HttpMethod.GET,
      }),
      providesTags: ["Organizations"],
    }),
    createOrganization: builder.mutation<OrganizationListItem, { name: string }>({
      query: (data) => ({
        url: auth.organizations,
        method: HttpMethod.POST,
        body: data,
      }),
      invalidatesTags: ["Organizations"],
    }),
    listInvitations: builder.query<Invitation[], void>({
      query: () => ({
        url: auth.invitations,
        method: HttpMethod.GET,
      }),
      providesTags: ["Invitations"],
    }),
    acceptInvitation: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: auth.acceptInvitation(id),
        method: HttpMethod.POST,
      }),
      invalidatesTags: ["Organizations", "Invitations"],
    }),
    declineInvitation: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: auth.declineInvitation(id),
        method: HttpMethod.POST,
      }),
      invalidatesTags: ["Invitations"],
    }),
    refreshTokens: builder.mutation<Token, void>({
      queryFn: async (_, api, extraOptions) => {
        const result = await baseQuery(
          { url: auth.refreshToken, method: HttpMethod.POST },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error as FetchBaseQueryError };
        }
        return { data: result.data as Token };
      },
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
  useRegisterMutation,
  useSelectOrganizationMutation,
  useSwitchOrganizationMutation,
  useListOrganizationsQuery,
  useCreateOrganizationMutation,
  useListInvitationsQuery,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useRefreshTokensMutation,
  useLogoutMutation,
  useProfileQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
