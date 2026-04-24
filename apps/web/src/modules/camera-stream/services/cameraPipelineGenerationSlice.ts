import { cameraApi } from "@/core/cameraApi";
import { createSlice } from "@reduxjs/toolkit";

/**
 * Per-stream counter bumped every time the server restarts its camera
 * pipeline for that stream. The CameraStreamProvider watches this and
 * tears down + rebuilds its RTCPeerConnection — without this, the PC
 * stays latched to the previous pipeline (e.g. the client still sees live
 * camera video after a replay has been deployed, even though detections
 * correctly reflect the replay).
 *
 * Mutations that restart the pipeline are listed below. This mirrors the
 * `close()` + `open()` calls visible in the camera API's Camera class
 * (deploy_nn, delete_nn, add_replay_video, remove_replay_video,
 * activate_sensor, deactivate_sensor). Dashboard deploy/remove are
 * included too — they carry an NN under the hood.
 */
export interface CameraPipelineGenerationState {
  byStream: Record<string, number>;
}

const initialState: CameraPipelineGenerationState = {
  byStream: {},
};

const keyFor = (mxid: string, streamName: string) => `${mxid}-${streamName}`;

export const cameraPipelineGenerationSlice = createSlice({
  name: "cameraPipelineGeneration",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const endpoints = [
      cameraApi.endpoints.deployNN,
      cameraApi.endpoints.removeNN,
      cameraApi.endpoints.deployDashboard,
      cameraApi.endpoints.removeDashboard,
      cameraApi.endpoints.addReplayVideo,
      cameraApi.endpoints.addReplayVideoFromUrl,
      cameraApi.endpoints.removeReplayVideo,
      cameraApi.endpoints.activateStream,
      cameraApi.endpoints.deactivateStream,
    ];

    endpoints.forEach((endpoint) => {
      builder.addMatcher(endpoint.matchFulfilled, (state, action) => {
        const args = action.meta.arg.originalArgs as {
          mxid?: string;
          streamName?: string;
        };
        if (!args?.mxid || !args?.streamName) return;
        const key = keyFor(args.mxid, args.streamName);
        state.byStream[key] = (state.byStream[key] ?? 0) + 1;
      });
    });
  },
});
