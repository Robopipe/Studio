import {
  useAddReplayVideoFromUrlMutation,
  useAddReplayVideoMutation,
  useDeployNNMutation,
  useGetNNQuery,
  useRemoveNNMutation,
  useRemoveReplayVideoMutation,
} from "@/core/cameraApi";
import type { DeviceInfo } from "@/core/cameraApi/schemas";
import type { NNRuntimeConfig, SahiConfig } from "@/core/cameraApi/schemas/nn";
import { DEFAULT_NN_RUNTIME_CONFIG } from "@/core/cameraApi/schemas/nn";
import { useLazyGetCapturedVideoQuery } from "@/modules/capture/services/captureApi";
import {
  useLazyGetModelOutputsQuery,
  useLazyGetModelQuery,
} from "@/modules/model/services/modelApi";
import { ModelOutputTypeEnum } from "@repo/schema";
import { useState } from "react";
import { toast } from "sonner";

const PLATFORM_TO_OUTPUT_TYPE: Record<string, string> = {
  X_LINK_MYRIAD_X: ModelOutputTypeEnum.RVC2,
  X_LINK_MYRIAD_2: ModelOutputTypeEnum.RVC2,
  X_LINK_RVC3: ModelOutputTypeEnum.RVC3,
  X_LINK_RVC4: ModelOutputTypeEnum.RVC4,
};

// Camera versions older than the URL-pull endpoint respond 404/405; if the
// camera is reachable but can't fetch the URL itself it responds 502. Any of
// these mean we should fall back to browser-side buffered upload rather than
// surface the error.
const URL_PULL_FALLBACK_STATUSES = new Set([404, 405, 502]);

export type DeployPhase =
  | "idle"
  | "preparing"
  | "loading-data"
  | "downloading-model"
  | "uploading-video"
  | "removing-video"
  | "deploying"
  | "stopping";

interface UseRunDeployParams {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedCameraInfo: DeviceInfo | undefined;
  projectId: number | null;
  modelId: number | null;
  capturedVideoId: number | null;
  sahiConfig: SahiConfig | null;
  runtimeConfig?: NNRuntimeConfig;
  // Returns the freshly-saved deploy-time snapshot for fields that the form
  // owns. We use this because the prop values come from RTK Query and stay
  // stale for one tick after saveIfDirty invalidates the tag.
  beforeDeploy?: () => Promise<
    { capturedVideoId: number | null; modelId: number | null } | undefined
  >;
}

export const useRunDeploy = ({
  selectedCamera,
  selectedStream,
  selectedCameraInfo,
  projectId,
  modelId,
  capturedVideoId,
  sahiConfig,
  runtimeConfig = DEFAULT_NN_RUNTIME_CONFIG,
  beforeDeploy,
}: UseRunDeployParams) => {
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [deployPhase, setDeployPhase] = useState<DeployPhase>("idle");

  // Single source of truth: the camera itself. The GET endpoint returns the
  // running NN config (200) or 404 if none is deployed. No local mirror —
  // that's what caused the "can't stop after refresh" and stale-banner bugs.
  const { data: isRemoteModelDeployed } = useGetNNQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );
  const isDeployed = !!isRemoteModelDeployed;

  const [triggerGetModelOutputs] = useLazyGetModelOutputsQuery();
  const [triggerGetModel] = useLazyGetModelQuery();
  const [triggerGetCapturedVideo] = useLazyGetCapturedVideoQuery();

  // Mutations
  const [deployNNMut] = useDeployNNMutation();
  const [removeNNMut] = useRemoveNNMutation();
  const [addReplayVideoMut] = useAddReplayVideoMutation();
  const [addReplayVideoFromUrlMut] = useAddReplayVideoFromUrlMutation();
  const [removeReplayVideoMut] = useRemoveReplayVideoMutation();

  const canDeploy = !!selectedCamera && !!selectedStream;

  /** Called when user clicks Deploy. Shows confirmation if a model is already running. */
  const handleDeploy = () => {
    if (!selectedCamera || !selectedStream || !selectedCameraInfo) return;

    if (isDeployed) {
      setShowDeployConfirm(true);
      return;
    }

    executeDeploy();
  };

  /** Actually runs the deploy (called directly or after user confirms override). */
  const executeDeploy = async () => {
    if (
      !selectedCamera ||
      !selectedStream ||
      !selectedCameraInfo ||
      projectId == null
    )
      return;

    let effectiveCapturedVideoId = capturedVideoId;
    let effectiveModelId = modelId;

    try {
      if (beforeDeploy) {
        setDeployPhase("preparing");
        try {
          const snapshot = await beforeDeploy();
          if (snapshot) {
            effectiveCapturedVideoId = snapshot.capturedVideoId;
            effectiveModelId = snapshot.modelId;
          }
        } catch (error) {
          toast.error(
            `Failed to save configuration changes: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          return;
        }
      }

      if (effectiveModelId == null) {
        toast.error("Select a trained model before deploying");
        return;
      }

      setDeployPhase("loading-data");

      const requiredOutputType =
        PLATFORM_TO_OUTPUT_TYPE[selectedCameraInfo.platform];

      const [modelOutputs, model] = await Promise.all([
        triggerGetModelOutputs({
          projectId,
          modelId: effectiveModelId,
        }).unwrap(),
        triggerGetModel({
          projectId,
          modelId: effectiveModelId,
        }).unwrap(),
      ]);

      const compatibleOutput = requiredOutputType
        ? modelOutputs.find((o) => o.type === requiredOutputType)
        : null;

      if (!compatibleOutput) {
        toast.error(
          `No compatible model output${requiredOutputType ? ` for ${requiredOutputType}` : ""}`,
        );
        return;
      }

      setDeployPhase("downloading-model");
      const modelBuffer = await fetch(compatibleOutput.filePath).then((res) =>
        res.arrayBuffer(),
      );
      const modelFile = new File([modelBuffer], "model.tar.xz");

      // Handle replay video before deploying
      setDeployPhase(
        effectiveCapturedVideoId != null ? "uploading-video" : "removing-video",
      );
      try {
        if (effectiveCapturedVideoId != null) {
          const video = await triggerGetCapturedVideo({
            projectId,
            videoId: effectiveCapturedVideoId,
          }).unwrap();

          const uploadBuffered = async () => {
            const videoResponse = await fetch(video.fileUrl);
            if (!videoResponse.ok) {
              throw new Error(
                `Failed to download replay video: ${videoResponse.status}`,
              );
            }
            const videoBlob = await videoResponse.blob();
            const videoFile = new File([videoBlob], "replay.webm", {
              type: videoBlob.type || "video/webm",
            });

            await addReplayVideoMut({
              mxid: selectedCamera,
              streamName: selectedStream,
              video: videoFile,
            }).unwrap();
          };

          // Preferred path: camera downloads the video itself. Avoids browser
          // buffering the whole file and sidesteps the HTTP/2 streaming-body
          // requirement for large in-browser uploads.
          try {
            await addReplayVideoFromUrlMut({
              mxid: selectedCamera,
              streamName: selectedStream,
              url: video.fileUrl,
              filename: "replay.webm",
            }).unwrap();
          } catch (err) {
            const status = (err as { status?: unknown })?.status;
            const shouldFallBack =
              typeof status === "number" &&
              URL_PULL_FALLBACK_STATUSES.has(status);
            if (!shouldFallBack) throw err;
            console.warn(
              "Camera URL-pull replay upload unavailable; falling back to buffered browser upload",
              err,
            );
            await uploadBuffered();
          }
        } else {
          await removeReplayVideoMut({
            mxid: selectedCamera,
            streamName: selectedStream,
          })
            .unwrap()
            .catch(() => {});
        }
      } catch (error) {
        toast.error(
          `Replay video setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return;
      }

      setDeployPhase("deploying");
      await deployNNMut({
        mxid: selectedCamera,
        streamName: selectedStream,
        model: modelFile,
        config: {
          type: "Generic",
          model_id: effectiveModelId,
          model_name: model.name,
          num_inference_threads: runtimeConfig.num_inference_threads,
          throttle_hz: runtimeConfig.throttle_hz,
          nn_config: sahiConfig ? { sahi_config: sahiConfig } : {},
        },
      }).unwrap();
    } finally {
      setDeployPhase("idle");
    }
  };

  const handleStop = async () => {
    if (!selectedCamera || !selectedStream) return;

    setDeployPhase("stopping");
    try {
      await removeNNMut({
        mxid: selectedCamera,
        streamName: selectedStream,
      })
        .unwrap()
        .catch(() => {});
      await removeReplayVideoMut({
        mxid: selectedCamera,
        streamName: selectedStream,
      })
        .unwrap()
        .catch(() => {});
    } finally {
      setDeployPhase("idle");
    }
  };

  const handleConfirmDeploy = () => {
    setShowDeployConfirm(false);
    executeDeploy();
  };

  const handleCancelDeploy = () => {
    setShowDeployConfirm(false);
  };

  return {
    handleDeploy,
    handleStop,
    isDeploying: deployPhase !== "idle",
    deployPhase,
    canDeploy,
    isDeployed,
    showDeployConfirm,
    handleConfirmDeploy,
    handleCancelDeploy,
  };
};
