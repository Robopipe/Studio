import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateLabel,
  CreateProjectRequest,
  Label,
  Project,
  ProjectListResponse,
} from "@repo/schema";
import z from "zod";
import { setActiveProject } from "./projectActions";

export enum ProjectApiTagType {
  Projects = "Projects",
  ProjectLabels = "ProjectLabels",
}

const { projects } = appConfig.studioApi.endpoints;
const projectApiBase = createApi({
  reducerPath: "projectApi",
  baseQuery: baseRefreshingQuery,
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
    getProject: builder.query<Project, { projectId: number }>({
      query: ({ projectId }) => ({
        url: projects.project(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: ProjectApiTagType.Projects, id: projectId },
      ],
    }),
    updateProject: builder.mutation<
      Project,
      {
        projectId: number;
        name: string;
        description: string;
        cameraApiUrl: string | null;
        multipleDashboardConfigs?: boolean;
      }
    >({
      query: ({ projectId, ...body }) => ({
        url: projects.project(projectId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: ProjectApiTagType.Projects },
        { type: ProjectApiTagType.Projects, id: projectId },
      ],
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
    createProjectLabel: builder.mutation<
      Label,
      CreateLabel & { projectId: number }
    >({
      query: ({ projectId, ...payload }) => ({
        url: projects.projectLabels(projectId),
        method: HttpMethod.POST,
        body: payload,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        {
          type: ProjectApiTagType.Projects,
          id: projectId,
          subType: ProjectApiTagType.ProjectLabels,
        },
      ],
    }),
    getProjectLabels: builder.query<Label[], { projectId: number }>({
      query: ({ projectId }) => ({
        url: projects.projectLabels(projectId),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId }) => [
        {
          type: ProjectApiTagType.Projects,
          id: projectId,
          subType: ProjectApiTagType.ProjectLabels,
        },
      ],
    }),
    deleteProjectLabel: builder.mutation<
      void,
      { projectId: number; labelId: number }
    >({
      query: ({ projectId, labelId }) => ({
        url: projects.projectLabel(projectId, labelId),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        {
          type: ProjectApiTagType.Projects,
          id: projectId,
          subType: ProjectApiTagType.ProjectLabels,
        },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateProjectMutation,
  useGetProjectsQuery,
  useLazyGetProjectsQuery,
  useGetProjectQuery,
  useDeleteProjectMutation,
  useCreateProjectLabelMutation,
  useGetProjectLabelsQuery,
  useLazyGetProjectLabelsQuery,
  useDeleteProjectLabelMutation,
  useUpdateProjectMutation,
} = projectApi;
