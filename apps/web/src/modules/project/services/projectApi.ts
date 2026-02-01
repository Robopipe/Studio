import { appConfig } from "@/config";
import { baseQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateProjectRequest,
  Project,
  ProjectListResponse,
} from "@repo/schema";
import z from "zod";
import { setActiveProject } from "./projectActions";

export enum ProjectApiTagType {
  Projects = "Projects",
}

const { projects } = appConfig.studioApi.endpoints;
const projectApiBase = createApi({
  reducerPath: "projectApi",
  baseQuery: baseQuery,
  tagTypes: Object.values(ProjectApiTagType),
  endpoints: () => ({}),
});

export const projectApi = projectApiBase.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation<Project, CreateProjectRequest>({
      query: (payload) => {
        return {
          url: projects.projects,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: (_result, _error) => [
        { type: ProjectApiTagType.Projects },
      ],
    }),
    getProjects: builder.query<Project[], void>({
      query: () => ({
        url: projects.projects,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error) => [{ type: ProjectApiTagType.Projects }],
      transformResponse: (response: ProjectListResponse) => response.projects,
      onQueryStarted: (_, { queryFulfilled, dispatch }) => {
        queryFulfilled.then(({ data }) => {
          const activeProjectId = z.coerce
            .number()
            .safeParse(sessionStorage.getItem("activeProjectId"));
          const activeProject = data.find((x) => x.id === activeProjectId.data);
          dispatch(setActiveProject(activeProject ?? null));
        });
      },
    }),
    deleteProject: builder.mutation<void, { projectId: number }>({
      query: ({ projectId }) => ({
        url: projects.project(projectId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error) => [
        { type: ProjectApiTagType.Projects },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateProjectMutation,
  useGetProjectsQuery,
  useDeleteProjectMutation,
} = projectApi;
