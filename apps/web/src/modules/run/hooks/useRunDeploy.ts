import {
  useAddReplayVideoFromUrlMutation,
  useAddReplayVideoMutation,
  useDeployDashboardMutation,
  useGetDashboardQuery,
  useRemoveDashboardMutation,
  useRemoveReplayVideoMutation,
} from "@/core/cameraApi";
import type { DeviceInfo } from "@/core/cameraApi/schemas";
import type { DeployConfigEntry } from "@/core/cameraApi/schemas/dashboard";
import type { NNRuntimeConfig, SahiConfig } from "@/core/cameraApi/schemas/nn";
import { DEFAULT_NN_RUNTIME_CONFIG } from "@/core/cameraApi/schemas/nn";
import { useLazyGetDashboardConfigsQuery } from "@/modules/dashboard/services/dashboardConfigApi";
import {
  useLazyGetEvalLimitQuery,
  useLazyGetEvalTestCaseQuery,
  useLazyGetEvalTestCasesQuery,
  useLazyGetEvalThresholdsQuery,
} from "@/modules/evaluation/api/evaluationApi";

import { useLazyGetCapturedVideoQuery } from "@/modules/capture/services/captureApi";
import { useLazyGetModelOutputsQuery } from "@/modules/model/services/modelApi";
import {
  useLazyGetProjectLabelsQuery,
  useLazyGetProjectsQuery,
} from "@/modules/project/services/projectApi";
import type { DashboardConfiguration } from "@repo/schema";
import { ModelOutputTypeEnum } from "@repo/schema";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { computeSettingsUnlock } from "../utils/dashboardUnlock";

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

export interface ConfigSelection {
  configId: number;
  projectId: number;
}

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
  activeConfigId: number | null;
  activeProjectId: number | null;
  capturedVideoId: number | null;
  cameraApiUrl: string | null;
  selectedConfigs?: ConfigSelection[];
  sahiConfig: SahiConfig | null;
  runtimeConfig?: NNRuntimeConfig;
  // Returns the freshly-saved deploy-time snapshot for fields that the form
  // owns. We use this for replay video because the prop value comes from RTK
  // Query and stays stale for one tick after saveIfDirty invalidates the tag.
  beforeDeploy?: () => Promise<{ capturedVideoId: number | null } | undefined>;
}

interface AssembledConfig {
  deployConfig: DeployConfigEntry;
  modelFile: File;
  configId: number;
}

interface ConfigIntermediate {
  pid: number;
  projectName: string;
  config: DashboardConfiguration;
  compatibleOutputFilePath: string;
  assembledTestCases: DeployConfigEntry["dashboard_config"]["testCases"];
  masterThresholds: DeployConfigEntry["dashboard_config"]["thresholds"];
  labels: DeployConfigEntry["dashboard_config"]["labels"];
}

export const useRunDeploy = ({
  selectedCamera,
  selectedStream,
  selectedCameraInfo,
  activeConfigId,
  activeProjectId,
  capturedVideoId,
  cameraApiUrl,
  selectedConfigs,
  sahiConfig,
  runtimeConfig = DEFAULT_NN_RUNTIME_CONFIG,
  beforeDeploy,
}: UseRunDeployParams) => {
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [deployPhase, setDeployPhase] = useState<DeployPhase>("idle");
  const [dashboardReloadNonce, setDashboardReloadNonce] = useState(0);

  // Single source of truth: the camera itself. The GET endpoint returns the
  // dashboard HTML (200) or 404 if none is running. No local mirror — that's
  // what caused the "can't stop after refresh" and stale-banner bugs.
  const { isSuccess: isRemoteDashboardDeployed } = useGetDashboardQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );

  const [settingsUnlockToken, setSettingsUnlockToken] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!selectedCamera || !selectedStream) {
      setSettingsUnlockToken(null);
      return;
    }
    let cancelled = false;
    computeSettingsUnlock(selectedCamera, selectedStream).then((token) => {
      if (!cancelled) setSettingsUnlockToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCamera, selectedStream]);

  const effectiveDashboardUrl = isRemoteDashboardDeployed
    ? (() => {
        const base = `${cameraApiUrl}/cameras/${selectedCamera}/streams/${selectedStream}/dashboard`;
        const params = new URLSearchParams();
        if (settingsUnlockToken) params.set("s", settingsUnlockToken);
        if (dashboardReloadNonce > 0)
          params.set("_r", String(dashboardReloadNonce));
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
      })()
    : null;
  const isDeployed = !!effectiveDashboardUrl;

  // Lazy triggers for multi-config deploy
  const [triggerGetProjects] = useLazyGetProjectsQuery();
  const [triggerGetDashboardConfigs] = useLazyGetDashboardConfigsQuery();
  const [triggerGetModelOutputs] = useLazyGetModelOutputsQuery();
  const [triggerGetProjectLabels] = useLazyGetProjectLabelsQuery();
  const [triggerGetEvalTestCases] = useLazyGetEvalTestCasesQuery();
  const [triggerGetEvalThresholds] = useLazyGetEvalThresholdsQuery();
  const [triggerGetTestCase] = useLazyGetEvalTestCaseQuery();
  const [triggerGetLimit] = useLazyGetEvalLimitQuery();

  // Mutations
  const [deployDashboardMut] = useDeployDashboardMutation();
  const [removeDashboardMut] = useRemoveDashboardMutation();
  const [addReplayVideoMut] = useAddReplayVideoMutation();
  const [addReplayVideoFromUrlMut] = useAddReplayVideoFromUrlMutation();
  const [removeReplayVideoMut] = useRemoveReplayVideoMutation();
  const [triggerGetCapturedVideo] = useLazyGetCapturedVideoQuery();

  const canDeploy = !!selectedCamera && !!selectedStream;

  /** Called when user clicks Deploy. Shows confirmation if a dashboard is already running. */
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
    if (!selectedCamera || !selectedStream || !selectedCameraInfo) return;

    let effectiveCapturedVideoId = capturedVideoId;

    try {
      if (beforeDeploy) {
        setDeployPhase("preparing");
        try {
          const snapshot = await beforeDeploy();
          if (snapshot) {
            effectiveCapturedVideoId = snapshot.capturedVideoId;
          }
        } catch (error) {
          toast.error(
            `Failed to save configuration changes: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          return;
        }
      }

      setDeployPhase("loading-data");

      const requiredOutputType =
        PLATFORM_TO_OUTPUT_TYPE[selectedCameraInfo.platform];

      // Fetch all projects and their dashboard configs
      const allProjects = await triggerGetProjects().unwrap();
      const projectConfigPairs = await Promise.all(
        allProjects.map(async (project) => {
          const projectConfigs = await triggerGetDashboardConfigs({
            projectId: project.id,
          }).unwrap();
          return projectConfigs
            .filter((c) => c.modelId != null)
            .map((config) => ({
              projectId: project.id,
              projectName: project.name,
              config,
            }));
        }),
      );
      let allConfigEntries = projectConfigPairs.flat();

      // If user has selected specific configs, filter to only those + active config
      if (selectedConfigs && selectedConfigs.length > 0) {
        const selectedIds = new Set(selectedConfigs.map((s) => s.configId));
        if (activeConfigId != null) selectedIds.add(activeConfigId);
        allConfigEntries = allConfigEntries.filter((e) =>
          selectedIds.has(e.config.id),
        );
      }

      if (allConfigEntries.length === 0) {
        toast.error("No deployable configurations found across projects");
        return;
      }

      // Pass 1: fetch eval/labels/outputs and build per-config intermediates.
      // Phase stays "loading-data" here.
      const intermediates: ConfigIntermediate[] = [];
      const skippedReasons: string[] = [];

      await Promise.all(
        allConfigEntries.map(
          async ({ projectId: pid, projectName, config }) => {
            try {
              const result = await fetchConfigData(
                pid,
                projectName,
                config,
                requiredOutputType,
              );
              if (result) {
                intermediates.push(result);
              } else {
                skippedReasons.push(
                  `"${config.name}" (${projectName}): no compatible model output${requiredOutputType ? ` for ${requiredOutputType}` : ""}`,
                );
              }
            } catch {
              skippedReasons.push(
                `"${config.name}" (${projectName}): failed to assemble`,
              );
            }
          },
        ),
      );

      if (skippedReasons.length > 0) {
        toast.warning(
          `Skipped ${skippedReasons.length} config(s): ${skippedReasons.join(", ")}`,
        );
      }

      if (intermediates.length === 0) {
        toast.error("No configurations could be assembled for deployment");
        return;
      }

      // Pass 2: download the model file for each intermediate.
      setDeployPhase("downloading-model");
      const assembled: AssembledConfig[] = await Promise.all(
        intermediates.map(downloadConfigModel),
      );

      // Active config first (backend deploys first config immediately)
      assembled.sort((a, b) => {
        if (a.configId === activeConfigId) return -1;
        if (b.configId === activeConfigId) return 1;
        return 0;
      });

      // Handle replay video before deploying
      setDeployPhase(
        effectiveCapturedVideoId != null && activeProjectId != null
          ? "uploading-video"
          : "removing-video",
      );
      try {
        if (effectiveCapturedVideoId != null && activeProjectId != null) {
          const video = await triggerGetCapturedVideo({
            projectId: activeProjectId,
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
      await deployDashboardMut({
        mxid: selectedCamera,
        streamName: selectedStream,
        configs: assembled.map((a) => a.deployConfig),
        models: assembled.map((a) => a.modelFile),
      }).unwrap();
      // Dashboard tab picks up the URL via useGetDashboardQuery — the deploy
      // mutation invalidates the Dashboard tag, which triggers refetch.
      // Increment the nonce so the iframe src changes and the browser reloads
      // the frame even when the camera/stream/token are unchanged (redeploy).
      setDashboardReloadNonce((n) => n + 1);
    } finally {
      setDeployPhase("idle");
    }
  };

  /**
   * Fetches eval data, labels, and finds a compatible model output for a
   * single config. Returns null if no compatible model output exists.
   * Does NOT download the model file — that's the second pass.
   */
  async function fetchConfigData(
    pid: number,
    projectName: string,
    config: DashboardConfiguration,
    requiredOutputType: string | undefined,
  ): Promise<ConfigIntermediate | null> {
    const [evalTestCases, evalThresholds, labels, modelOutputs] =
      await Promise.all([
        triggerGetEvalTestCases({
          projectId: pid,
          configId: config.id,
        }).unwrap(),
        triggerGetEvalThresholds({
          projectId: pid,
          configId: config.id,
        }).unwrap(),
        triggerGetProjectLabels({ projectId: pid }).unwrap(),
        triggerGetModelOutputs({
          projectId: pid,
          modelId: config.modelId!,
        }).unwrap(),
      ]);

    const compatibleOutput = requiredOutputType
      ? modelOutputs.find((o) => o.type === requiredOutputType)
      : null;

    if (!compatibleOutput) return null;

    // Fetch detailed test case data with limits
    const testCaseDetails = await Promise.all(
      evalTestCases.map((tc) =>
        triggerGetTestCase({
          projectId: pid,
          configId: config.id,
          testCaseId: tc.id,
        }).unwrap(),
      ),
    );

    const testCasesWithFullLimits = await Promise.all(
      testCaseDetails.map(async (tc) => {
        const fullLimits = await Promise.all(
          tc.limits.map((limit) =>
            triggerGetLimit({
              projectId: pid,
              configId: config.id,
              testCaseId: tc.id,
              limitId: limit.id,
            }).unwrap(),
          ),
        );
        return { ...tc, limits: fullLimits };
      }),
    );

    const thresholdsByTestCase = new Map(
      evalThresholds.testCases.map((t) => [t.id, t.thresholds]),
    );

    const assembledTestCases = testCasesWithFullLimits.map((tc) => ({
      id: tc.id,
      name: tc.name,
      type: tc.type,
      severity: tc.severity,
      enabled: tc.enabled,
      limits: tc.limits.map((limit) => ({
        id: limit.id,
        name: limit.name,
        severity: limit.severity,
        enabled: limit.enabled,
        targetLabel: limit.targetLabel,
        targetParentLabel: limit.targetParentLabel,
        limitItems: limit.limitItems.map((item) => ({
          id: item.id,
          limitFrom: item.limitFrom,
          limitTo: item.limitTo,
          parameter: item.parameter,
          operator: item.operator,
          quantifierType: item.quantifierType,
          quantifierUnit: item.quantifierUnit,
          quantifierValue: item.quantifierValue,
          targetEdge: item.targetEdge,
          parentEdge: item.parentEdge,
        })),
      })),
      logicNodes: tc.logicNodes,
      thresholds: (thresholdsByTestCase.get(tc.id) ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        color: t.color,
        testCaseId: tc.id,
      })),
    }));

    return {
      pid,
      projectName,
      config,
      compatibleOutputFilePath: compatibleOutput.filePath,
      assembledTestCases,
      masterThresholds: evalThresholds.master.map((t) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        color: t.color,
      })),
      labels,
    };
  }

  /** Downloads the model file and assembles the final DeployConfigEntry. */
  async function downloadConfigModel(
    intermediate: ConfigIntermediate,
  ): Promise<AssembledConfig> {
    const {
      pid,
      projectName,
      config,
      assembledTestCases,
      masterThresholds,
      labels,
    } = intermediate;
    const modelBuffer = await fetch(intermediate.compatibleOutputFilePath).then(
      (res) => res.arrayBuffer(),
    );

    return {
      deployConfig: {
        dashboard_config: {
          id: config.id,
          name: config.name,
          projectId: pid,
          projectName,
          zoneDirection: config.zoneDirection,
          zoneCenter: config.zoneCenter,
          zoneThickness: config.zoneThickness,
          optimistic: config.optimistic,
          testCases: assembledTestCases,
          thresholds: masterThresholds,
          labels,
        },
        nn_config: {
          type: "Generic",
          model_id: config.modelId,
          num_inference_threads: runtimeConfig.num_inference_threads,
          throttle_hz: runtimeConfig.throttle_hz,
          nn_config: sahiConfig ? { sahi_config: sahiConfig } : {},
        },
      },
      modelFile: new File([modelBuffer], "model.tar.xz"),
      configId: config.id,
    };
  }

  const handleStop = async () => {
    if (!selectedCamera || !selectedStream) return;

    setDeployPhase("stopping");
    try {
      await removeDashboardMut({
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
      // Tag invalidation in the mutations drops dashboardUrl to null via the
      // query refetch — no local state to reset.
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
    dashboardUrl: effectiveDashboardUrl,
    canDeploy,
    showDeployConfirm,
    handleConfirmDeploy,
    handleCancelDeploy,
  };
};
