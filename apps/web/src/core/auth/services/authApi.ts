import { appConfig } from "@/config";
import { baseQuery, baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import {
  ChangePassword,
  ForgotPassword,
  Invitation,
  Login,
  OrganizationListItem,
  PreAuthToken,
  Register,
  ResendVerification,
  ResetPassword,
  SelectOrganization,
  Token,
  UpdateUserRequest,
  User,
  VerifyEmail,
} from "@repo/schema";

const { auth } = appConfig.studioApi.endpoints;
const authApiBase = createApi({
  reducerPath: "authApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: ["Organizations", "Invitations", "Profile"],
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
    refreshTokens: builder.mutation<Token | PreAuthToken, void>({
      queryFn: async (_, api, extraOptions) => {
        const result = await baseQuery(
          { url: auth.refreshToken, method: HttpMethod.POST },
          api,
          extraOptions,
        );
        if (result.error) {
          return { error: result.error as FetchBaseQueryError };
        }
        return { data: result.data as Token | PreAuthToken };
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
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<User, UpdateUserRequest>({
      query: (data) => ({
        url: auth.profile,
        method: HttpMethod.PUT,
        body: data,
      }),
      invalidatesTags: ["Profile"],
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
    changePassword: builder.mutation<{ message: string }, ChangePassword>({
      query: (data) => ({
        url: auth.changePassword,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    verifyEmail: builder.mutation<{ message: string }, VerifyEmail>({
      query: (data) => ({
        url: auth.verifyEmail,
        method: HttpMethod.POST,
        body: data,
      }),
    }),
    resendVerification: builder.mutation<{ message: string }, ResendVerification>({
      query: (data) => ({
        url: auth.resendVerification,
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
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
