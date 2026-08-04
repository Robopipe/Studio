import { HttpMethod } from "@/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import type {
  DeviceInfo,
  SensorControl,
  SensorControlCapabilities,
  SensorControlUpdate,
  StillConfig,
  StillConfigOption,
  StreamInfo,
} from "./schemas";
import { NNConfig } from "./schemas/nn";
import { CameraApiTagType } from "./tagType";

const LIST_CAMERAS_TIMEOUT_MS = 5000;

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
      extraOptions: { timeoutMs: LIST_CAMERAS_TIMEOUT_MS },
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

    // Restart camera (tears down and rebuilds the whole camera pipeline)
    restartCamera: builder.mutation<void, { mxid: string }>({
      query: ({ mxid }) => ({
        url: `/cameras/${mxid}/restart`,
        method: HttpMethod.POST,
      }),
      invalidatesTags: (_r, _e, { mxid }) => [
        { type: CameraApiTagType.Cameras, id: mxid },
        { type: CameraApiTagType.Streams, id: mxid },
        CameraApiTagType.StreamControl,
        CameraApiTagType.StreamControlCapabilities,
        CameraApiTagType.StreamConfig,
        CameraApiTagType.NN,
        CameraApiTagType.Replay,
      ],
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

    // Batch activate/deactivate streams
    batchUpdateStreams: builder.mutation<
      StreamInfo[],
      { mxid: string; activate: string[]; deactivate: string[] }
    >({
      query: ({ mxid, activate, deactivate }) => ({
        url: `/cameras/${mxid}/streams/`,
        method: HttpMethod.PATCH,
        body: { activate, deactivate },
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

    // Get stream control capabilities
    getStreamControlCapabilities: builder.query<
      SensorControlCapabilities,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/control/capabilities`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { mxid, streamName }) => [
        {
          type: CameraApiTagType.StreamControlCapabilities,
          id: `${mxid}-${streamName}`,
        },
      ],
    }),

    // Update stream control (partial)
    updateStreamControl: builder.mutation<
      SensorControl,
      { mxid: string; streamName: string; control: SensorControlUpdate }
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

    // Reset stream control to defaults
    resetStreamControl: builder.mutation<
      SensorControl,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/control/reset`,
        method: HttpMethod.POST,
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.StreamControl, id: `${mxid}-${streamName}` },
      ],
    }),

    // Get still image capture config
    getStreamConfig: builder.query<
      StillConfig,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/config`,
        method: HttpMethod.GET,
      }),
      providesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.StreamConfig, id: `${mxid}-${streamName}` },
      ],
    }),

    // Get available still config options (sensor-hardware-defined, effectively immutable)
    getAvailableStreamConfigs: builder.query<
      StillConfigOption[],
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/config/available`,
        method: HttpMethod.GET,
      }),
    }),

    // Update still image capture config (causes pipeline restart)
    updateStreamConfig: builder.mutation<
      StillConfig,
      { mxid: string; streamName: string; config: StillConfig }
    >({
      query: ({ mxid, streamName, config }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/config`,
        method: HttpMethod.POST,
        body: config,
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.StreamConfig, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.StreamControl, id: `${mxid}-${streamName}` },
        {
          type: CameraApiTagType.StreamControlCapabilities,
          id: `${mxid}-${streamName}`,
        },
        { type: CameraApiTagType.NN, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.Replay, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.Streams, id: mxid },
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

    // ========== Replay Video Endpoints ==========

    addReplayVideo: builder.mutation<
      void,
      { mxid: string; streamName: string; video: File }
    >({
      query: ({ mxid, streamName, video }) => {
        const data = new FormData();
        data.append("video", video);
        return {
          url: `/cameras/${mxid}/streams/${streamName}/replay`,
          method: HttpMethod.POST,
          body: data,
        };
      },
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.Replay, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.Streams, id: mxid },
      ],
    }),

    addReplayVideoFromUrl: builder.mutation<
      void,
      { mxid: string; streamName: string; url: string; filename?: string }
    >({
      query: ({ mxid, streamName, url, filename }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/replay`,
        method: HttpMethod.POST,
        body: { url, filename },
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.Replay, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.Streams, id: mxid },
      ],
    }),

    removeReplayVideo: builder.mutation<
      void,
      { mxid: string; streamName: string }
    >({
      query: ({ mxid, streamName }) => ({
        url: `/cameras/${mxid}/streams/${streamName}/replay`,
        method: HttpMethod.DELETE,
      }),
      invalidatesTags: (_result, _error, { mxid, streamName }) => [
        { type: CameraApiTagType.Replay, id: `${mxid}-${streamName}` },
        { type: CameraApiTagType.Streams, id: mxid },
      ],
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
  useRestartCameraMutation,

  // Stream hooks
  useListStreamsQuery,
  useActivateStreamMutation,
  useDeactivateStreamMutation,
  useBatchUpdateStreamsMutation,
  useGetStreamControlQuery,
  useGetStreamControlCapabilitiesQuery,
  useUpdateStreamControlMutation,
  useResetStreamControlMutation,
  useGetStreamConfigQuery,
  useGetAvailableStreamConfigsQuery,
  useUpdateStreamConfigMutation,

  // NN hooks
  useGetNNQuery,
  useDeployNNMutation,
  useRemoveNNMutation,

  // Replay hooks
  useAddReplayVideoMutation,
  useAddReplayVideoFromUrlMutation,
  useRemoveReplayVideoMutation,
} = cameraApi;
