import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { InviteUser, OrganizationMember, OrganizationMembersResponse, UpdateMemberRole } from "@repo/schema";

const { organizations } = appConfig.studioApi.endpoints;

export enum OrganizationApiTagType {
  Organization = "Organization",
  OrganizationMembers = "OrganizationMembers",
}

const organizationApiBase = createApi({
  reducerPath: "organizationApi",
  baseQuery: baseRefreshingQuery,
  tagTypes: Object.values(OrganizationApiTagType),
  endpoints: () => ({}),
});

export const organizationApi = organizationApiBase.injectEndpoints({
  endpoints: (builder) => ({
    getOrganization: builder.query<{ id: number; name: string }, void>({
      query: () => ({
        url: organizations.current,
        method: HttpMethod.GET,
      }),
      providesTags: [OrganizationApiTagType.Organization],
    }),
    updateOrganization: builder.mutation<{ id: number; name: string }, { name: string }>({
      query: (data) => ({
        url: organizations.current,
        method: HttpMethod.PATCH,
        body: data,
      }),
      invalidatesTags: [OrganizationApiTagType.Organization],
    }),
    getMembers: builder.query<OrganizationMember[], void>({
      query: () => ({
        url: organizations.members,
        method: HttpMethod.GET,
      }),
      transformResponse: (response: OrganizationMembersResponse) =>
        response.members,
      providesTags: [OrganizationApiTagType.OrganizationMembers],
    }),
    inviteUser: builder.mutation<{ message: string }, InviteUser>({
      query: (data) => ({
        url: organizations.invite,
        method: HttpMethod.POST,
        body: data,
      }),
      invalidatesTags: [OrganizationApiTagType.OrganizationMembers],
    }),
    removeMember: builder.mutation<{ message: string }, number>({
      query: (userId) => ({
        url: organizations.member(userId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: [OrganizationApiTagType.OrganizationMembers],
    }),
    updateMemberRole: builder.mutation<{ message: string }, { userId: number } & UpdateMemberRole>({
      query: ({ userId, role }) => ({
        url: organizations.memberRole(userId),
        method: HttpMethod.PATCH,
        body: { role },
      }),
      invalidatesTags: [OrganizationApiTagType.OrganizationMembers],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
  useGetMembersQuery,
  useInviteUserMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} = organizationApi;
