import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { InviteUser, OrganizationMembersResponse, User } from "@repo/schema";

const { organizations } = appConfig.studioApi.endpoints;

export enum OrganizationApiTagType {
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
    getMembers: builder.query<User[], void>({
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
  }),
  overrideExisting: true,
});

export const { useGetMembersQuery, useInviteUserMutation } = organizationApi;
