import { appConfig } from "@/config";
import { baseRefreshingQuery } from "@/core/api/baseQuery";
import {
  captureApi,
  CaptureApiTagType,
} from "@/modules/capture/services/captureApi";
import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateLabel,
  CreateProjectRequest,
  Label,
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
  Project,
  ProjectListResponse,
} from "@repo/schema";
import z from "zod";
import { setActiveProject } from "./projectActions";

export enum ProjectApiTagType {
  Projects = "Projects",
  ProjectLabels = "ProjectLabels",
  PreAnnotateSettings = "PreAnnotateSettings",
}

const { projects, preAnnotateSettings: preAnnotateSettingsEndpoint } =
  appConfig.studioApi.endpoints;
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
        cameraMxid: string | null;
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
    updateProjectLabel: builder.mutation<
      Label,
      { projectId: number; labelId: number; name: string; color: string }
    >({
      query: ({ projectId, labelId, ...body }) => ({
        url: projects.projectLabel(projectId, labelId),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        {
          type: ProjectApiTagType.Projects,
          id: projectId,
          subType: ProjectApiTagType.ProjectLabels,
        },
      ],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(captureApi.util.invalidateTags([CaptureApiTagType.Tasks]));
        } catch {
          // mutation failed — nothing to invalidate
        }
      },
    }),
    getPreAnnotateSettings: builder.query<
      PreAnnotateSettings | null,
      { projectId: number; modelType: PreAnnotateModelTypeEnum }
    >({
      query: ({ projectId, modelType }) => ({
        url: preAnnotateSettingsEndpoint(projectId, modelType),
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { projectId, modelType }) => [
        {
          type: ProjectApiTagType.PreAnnotateSettings,
          id: `${projectId}-${modelType}`,
        },
      ],
    }),
    updatePreAnnotateSettings: builder.mutation<
      PreAnnotateSettings,
      { projectId: number; modelType: PreAnnotateModelTypeEnum; body: PreAnnotateSettings }
    >({
      query: ({ projectId, modelType, body }) => ({
        url: preAnnotateSettingsEndpoint(projectId, modelType),
        method: HttpMethod.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, modelType }) => [
        {
          type: ProjectApiTagType.PreAnnotateSettings,
          id: `${projectId}-${modelType}`,
        },
      ],
    }),
    deletePreAnnotateSettings: builder.mutation<
      void,
      { projectId: number; modelType: PreAnnotateModelTypeEnum }
    >({
      query: ({ projectId, modelType }) => ({
        url: preAnnotateSettingsEndpoint(projectId, modelType),
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { projectId, modelType }) => [
        {
          type: ProjectApiTagType.PreAnnotateSettings,
          id: `${projectId}-${modelType}`,
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
  useUpdateProjectLabelMutation,
  useUpdateProjectMutation,
  useGetPreAnnotateSettingsQuery,
  useUpdatePreAnnotateSettingsMutation,
  useDeletePreAnnotateSettingsMutation,
} = projectApi;
