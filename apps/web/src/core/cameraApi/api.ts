import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import type { DeviceInfo, SensorControl, StreamInfo } from "./schemas";
import {
  CameraApiDashboardConfig,
  DeployDashboardResponse,
} from "./schemas/dashboard";
import { NNConfig } from "./schemas/nn";
import { CameraApiTagType } from "./tagType";

const cameraApiBase = createApi({
  reducerPath: "cameraApi",
  baseQuery: baseQuery,
  tagTypes: Object.values(CameraApiTagType),
  endpoints: () => ({}),
});

export const cameraApi = cameraApiBase.injectEndpoints({
  endpoints: (builder) => ({
    // ========== Camera Endpoints ==========

    // List all cameras
    listCameras: builder.query<DeviceInfo[], void>({
      query: () => ({
        url: "/cameras/",
        method: HttpMethod.GET,
      }),
      providesTags: [CameraApiTagType.Cameras],
    }),

    // Get camera by MXID
    getCamera: builder.query<DeviceInfo, string>({
      query: (mxid) => ({
        url: `/cameras/${mxid}/`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, mxid) => [
        { type: CameraApiTagType.Cameras, id: mxid },
      ],
    }),

    // Create camera
    createCamera: builder.mutation<DeviceInfo, string>({
      query: (mxid) => ({
        url: `/cameras/${mxid}/`,
        method: HttpMethod.POST,
      }),
      invalidatesTags: [CameraApiTagType.Cameras],
    }),

    // Delete camera
    deleteCamera: builder.mutation<DeviceInfo, string>({
      query: (mxid) => ({
        url: `/cameras/${mxid}/`,
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: [CameraApiTagType.Cameras],
    }),

    // ========== Stream Endpoints ==========

    // List all streams
    listStreams: builder.query<StreamInfo[], string>({
      query: (mxid) => ({
        url: `/cameras/${mxid}/streams/`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, mxid) => [
        { type: CameraApiTagType.Streams, id: mxid },
      ],
    }),

    // Activate stream
    activateStream: builder.mutation<
      void,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/`,
        method: HttpMethod.POST,
      }),
      invalidatesTags: (_result, _error, { mxid }) => [
        { type: CameraApiTagType.Streams, id: mxid },
      ],
    }),

    // Deactivate stream
    deactivateStream: builder.mutation<
      void,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/`,
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { mxid }) => [
        { type: CameraApiTagType.Streams, id: mxid },
      ],
    }),

    // Get stream control
    getStreamControl: builder.query<
      SensorControl,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/control`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.StreamControl, id: `${mxid}-${streamName}` },
      ],
    }),

    // Update stream control
    updateStreamControl: builder.mutation<
      SensorControl,
      { mxid: string; streamName: string; control: SensorControl }
    >({
      query: ({ mxid, streamName, control }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/control`,
        method: HttpMethod.POST,
        body: control,
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.StreamControl, id: `${mxid}-${streamName}` },
      ],
    }),

    getNN: builder.query<NNConfig, { mxid: string; streamName: string }>({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/nn`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.NN, id: `${mxid}-${streamName}` },
      ],
    }),

    deployNN: builder.mutation<
      void,
      { mxid: string; streamName: string; model: File; config: NNConfig }
    >({
      query: ({ mxid, streamName, model, config }) => {
        const data = new FormData();
        data.append("model", model);
        data.append("config", JSON.stringify(config));
        return {
          url: `/cameras/${mxid}/streams/${streamName}/nn`,
          method: HttpMethod.POST,
          body: data,
        };
      },
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.NN, id: `${mxid}-${streamName}` },
      ],
    }),

    removeNN: builder.mutation<void, { mxid: string; streamName: string }>({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/nn`,
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.NN, id: `${mxid}-${streamName}` },
      ],
    }),

    deployDashboard: builder.mutation<
      DeployDashboardResponse,
      {
        mxid: string;
        streamName: string;
        dashboardConfig: CameraApiDashboardConfig;
      }
    >({
      query: ({ mxid, streamName, dashboardConfig }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/dashboard`,
        method: HttpMethod.POST,
        body: dashboardConfig,
      }),
    }),

    removeDashboard: builder.mutation<
      void,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/dashboard`,
        method: HttpMethod.DELETE,
      }),
    }),
  }),
  overrideExisting: true,
});

// Export hooks for all endpoints
export const {
  // Camera hooks
  useListCamerasQuery,
  useGetCameraQuery,
  useCreateCameraMutation,
  useDeleteCameraMutation,

  // Stream hooks
  useListStreamsQuery,
  useActivateStreamMutation,
  useDeactivateStreamMutation,
  useGetStreamControlQuery,
  useUpdateStreamControlMutation,

  // NN hooks
  useGetNNQuery,
  useDeployNNMutation,
  useRemoveNNMutation,

  // Dashboard hooks
  useDeployDashboardMutation,
  useRemoveDashboardMutation,
} = cameraApi;
