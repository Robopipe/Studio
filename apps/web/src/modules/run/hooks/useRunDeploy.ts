import {
  useDeployDashboardMutation,
  useGetDashboardQuery,
  useRemoveDashboardMutation,
  useRemoveNNMutation,
} from "@/core/cameraApi";
import type { DeployConfigEntry } from "@/core/cameraApi/schemas/dashboard";
import type { DeviceInfo } from "@/core/cameraApi/schemas";
import { useLazyGetDashboardConfigsQuery } from "@/modules/dashboard/services/dashboardConfigApi";
import {
  useLazyGetEvalLimitQuery,
  useLazyGetEvalTestCaseQuery,
  useLazyGetEvalTestCasesQuery,
  useLazyGetEvalThresholdsQuery,
} from "@/modules/evaluation/api/evaluationApi";
import { useLazyGetModelOutputsQuery } from "@/modules/model/services/modelApi";
import {
  useLazyGetProjectLabelsQuery,
  useLazyGetProjectsQuery,
} from "@/modules/project/services/projectApi";
import type { DashboardConfiguration } from "@repo/schema";
import { ModelOutputTypeEnum } from "@repo/schema";
import { useState } from "react";
import { toast } from "sonner";

const PLATFORM_TO_OUTPUT_TYPE: Record<string, string> = {
  X_LINK_MYRIAD_X: ModelOutputTypeEnum.RVC2,
  X_LINK_MYRIAD_2: ModelOutputTypeEnum.RVC2,
  X_LINK_RVC3: ModelOutputTypeEnum.RVC3,
  X_LINK_RVC4: ModelOutputTypeEnum.RVC4,
};

export interface ConfigSelection {
  configId: number;
  projectId: number;
}

interface UseRunDeployParams {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedCameraInfo: DeviceInfo | undefined;
  activeConfigId: number | null;
  cameraApiUrl: string | null;
  selectedConfigs?: ConfigSelection[];
}

interface AssembledConfig {
  deployConfig: DeployConfigEntry;
  modelFile: File;
  configId: number;
}

export const useRunDeploy = ({
  selectedCamera,
  selectedStream,
  selectedCameraInfo,
  activeConfigId,
  cameraApiUrl,
  selectedConfigs,
}: UseRunDeployParams) => {
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);

  // Check if a dashboard is already deployed on the camera (survives refresh).
  // The GET endpoint returns the dashboard HTML (200) or 404 if none is running.
  const { isSuccess: isRemoteDashboardDeployed } = useGetDashboardQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );

  // The dashboard URL is the GET endpoint itself (it serves the HTML directly).
  // Local state (set after deploy) takes precedence over the query-derived URL.
  const remoteDashboardUrl = isRemoteDashboardDeployed
    ? `${cameraApiUrl}/cameras/${selectedCamera}/streams/${selectedStream}/dashboard`
    : null;

  const effectiveDashboardUrl = dashboardUrl ?? remoteDashboardUrl;
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
  const [deployDashboardMut, { isLoading: isDeploying }] =
    useDeployDashboardMutation();
  const [removeNNMut] = useRemoveNNMutation();
  const [removeDashboardMut] = useRemoveDashboardMutation();

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

    // Assemble deploy payload for each config in parallel
    const assembled: AssembledConfig[] = [];
    const skippedReasons: string[] = [];

    await Promise.all(
      allConfigEntries.map(async ({ projectId: pid, projectName, config }) => {
        try {
          const result = await assembleConfigPayload(
            pid,
            projectName,
            config,
            requiredOutputType,
          );
          if (result) {
            assembled.push(result);
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
      }),
    );

    if (skippedReasons.length > 0) {
      toast.warning(
        `Skipped ${skippedReasons.length} config(s): ${skippedReasons.join(", ")}`,
      );
    }

    if (assembled.length === 0) {
      toast.error("No configurations could be assembled for deployment");
      return;
    }

    // Active config first (backend deploys first config immediately)
    assembled.sort((a, b) => {
      if (a.configId === activeConfigId) return -1;
      if (b.configId === activeConfigId) return 1;
      return 0;
    });

    const { dashboard_url } = await deployDashboardMut({
      mxid: selectedCamera,
      streamName: selectedStream,
      configs: assembled.map((a) => a.deployConfig),
      models: assembled.map((a) => a.modelFile),
    }).unwrap();

    // Set URL immediately so the dashboard tab works right away
    setDashboardUrl(`${cameraApiUrl}${dashboard_url}`);
  };

  /**
   * Assembles a single config's deploy payload: fetches eval data, labels,
   * finds a compatible model output, and downloads the model file.
   * Returns null if no compatible model output exists.
   */
  async function assembleConfigPayload(
    pid: number,
    projectName: string,
    config: DashboardConfiguration,
    requiredOutputType: string | undefined,
  ): Promise<AssembledConfig | null> {
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
      evalThresholds.map((t) => [t.id, t.thresholds]),
    );

    const assembledTestCases = testCasesWithFullLimits.map((tc) => ({
      id: tc.id,
      name: tc.name,
      type: tc.type,
      severity: tc.severity,
      limits: tc.limits.map((limit) => ({
        id: limit.id,
        name: limit.name,
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

    const modelBuffer = await fetch(compatibleOutput.filePath).then((res) =>
      res.arrayBuffer(),
    );

    return {
      deployConfig: {
        dashboard_config: {
          id: config.id,
          name: config.name,
          projectId: pid,
          projectName,
          lineDirection: config.lineDirection,
          linePosition: config.linePosition,
          lineFlow: config.lineFlow,
          testCases: assembledTestCases,
          labels: labels,
        },
        nn_config: {
          type: "Generic",
          model_id: config.modelId,
          nn_config: {},
        },
      },
      modelFile: new File([modelBuffer], "model.tar.xz"),
      configId: config.id,
    };
  }

  const handleStop = async () => {
    if (!selectedCamera || !selectedStream) return;

    await Promise.all([
      removeNNMut({ mxid: selectedCamera, streamName: selectedStream })
        .unwrap()
        .catch(() => {}),
      removeDashboardMut({ mxid: selectedCamera, streamName: selectedStream })
        .unwrap()
        .catch(() => {}),
    ]);

    setDashboardUrl(null);
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
    isDeploying,
    dashboardUrl: effectiveDashboardUrl,
    canDeploy,
    showDeployConfirm,
    handleConfirmDeploy,
    handleCancelDeploy,
  };
};
