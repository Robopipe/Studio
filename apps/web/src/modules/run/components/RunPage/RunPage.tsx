import {
  useDeployDashboardMutation,
  useListCamerasQuery,
  useRemoveDashboardMutation,
  useRemoveNNMutation,
} from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { DashboardPage } from "@/modules/dashboard";
import {
  useGetDashboardConfigQuery,
  useGetDashboardConfigsQuery,
} from "@/modules/dashboard/services/dashboardConfigApi";
import {
  useGetEvalTestCasesQuery,
  useGetEvalThresholdsQuery,
  useLazyGetEvalLimitQuery,
  useLazyGetEvalTestCaseQuery,
} from "@/modules/evaluation/api/evaluationApi";
import { useGetModelOutputsQuery } from "@/modules/model/services/modelApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { ModelOutputTypeEnum } from "@repo/schema";
import { Stack, Text } from "@repo/ui";
import { Settings, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigurationTab } from "../ConfigurationTab";
import { LiveInference } from "../LiveInference";
import { RunSubheader, RunTab } from "../RunSubheader";
import styles from "./RunPage.module.scss";

const PLATFORM_TO_OUTPUT_TYPE: Record<string, string> = {
  X_LINK_MYRIAD_X: ModelOutputTypeEnum.RVC2,
  X_LINK_MYRIAD_2: ModelOutputTypeEnum.RVC2,
  X_LINK_RVC3: ModelOutputTypeEnum.RVC3,
  X_LINK_RVC4: ModelOutputTypeEnum.RVC4,
};

export const RunPage = () => {
  const [activeTab, setActiveTab] = useState<RunTab>("configuration");
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;
  const cameraApiUrl = useCameraApiUrl();

  // Fetch configs list so we can auto-select on mount (regardless of active tab)
  const { data: configs = [] } = useGetDashboardConfigsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  useEffect(() => {
    if (activeConfigId === null && configs.length > 0) {
      setActiveConfigId(configs[0].id);
    }
  }, [configs, activeConfigId]);

  const {
    data: cameras,
    isLoading: camerasLoading,
    refetch: refetchCameras,
    isFetching: camerasFetching,
  } = useListCamerasQuery();

  // Read camera/stream/model from persisted dashboard config
  const { data: dashboardConfig } = useGetDashboardConfigQuery(
    { projectId: projectId!, configId: activeConfigId! },
    { skip: !projectId || !activeConfigId },
  );

  const selectedCamera = dashboardConfig?.cameraMxid ?? null;
  const selectedStream = dashboardConfig?.streamName ?? null;
  const configModelId = dashboardConfig?.modelId ?? null;

  // Fetch model outputs for deploy
  const { data: modelOutputs } = useGetModelOutputsQuery(
    { projectId: projectId!, modelId: configModelId! },
    { skip: !projectId || !configModelId },
  );

  // Find compatible model output based on camera platform
  const selectedCameraInfo = cameras?.find((c) => c.mxid === selectedCamera);
  const compatibleOutput = useMemo(() => {
    if (!selectedCameraInfo || !modelOutputs?.length) return null;
    const requiredType = PLATFORM_TO_OUTPUT_TYPE[selectedCameraInfo.platform];
    if (!requiredType) return null;
    return modelOutputs.find((o) => o.type === requiredType) ?? null;
  }, [selectedCameraInfo, modelOutputs]);

  // Eval data for deploy payload
  const { data: evalTestCases = [] } = useGetEvalTestCasesQuery(
    { projectId: projectId!, configId: activeConfigId! },
    { skip: !projectId || !activeConfigId },
  );
  const { data: evalThresholds = [] } = useGetEvalThresholdsQuery(
    { projectId: projectId!, configId: activeConfigId! },
    { skip: !projectId || !activeConfigId },
  );
  const { data: projectLabels = [] } = useGetProjectLabelsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );
  const [triggerGetTestCase] = useLazyGetEvalTestCaseQuery();
  const [triggerGetLimit] = useLazyGetEvalLimitQuery();

  // Deploy/stop mutations
  const [deployDashboardMut, { isLoading: isDeploying }] =
    useDeployDashboardMutation();
  const [removeNNMut] = useRemoveNNMutation();
  const [removeDashboardMut] = useRemoveDashboardMutation();

  const canDeploy =
    !!selectedCamera &&
    !!selectedStream &&
    !!configModelId &&
    !!compatibleOutput;

  const handleDeploy = async () => {
    if (
      !selectedCamera ||
      !selectedStream ||
      !configModelId ||
      !compatibleOutput ||
      !dashboardConfig ||
      !activeConfigId ||
      !projectId
    )
      return;

    // Fetch full test case details (with logicNodes) and limit details (with limitItems)
    const testCaseDetails = await Promise.all(
      evalTestCases.map((tc) =>
        triggerGetTestCase({
          projectId,
          configId: activeConfigId,
          testCaseId: tc.id,
        }).unwrap(),
      ),
    );

    const testCasesWithFullLimits = await Promise.all(
      testCaseDetails.map(async (tc) => {
        const fullLimits = await Promise.all(
          tc.limits.map((limit) =>
            triggerGetLimit({
              projectId,
              configId: activeConfigId,
              testCaseId: tc.id,
              limitId: limit.id,
            }).unwrap(),
          ),
        );
        return { ...tc, limits: fullLimits };
      }),
    );

    // Build threshold map: testCaseId -> thresholds
    const thresholdsByTestCase = new Map(
      evalThresholds.map((t) => [t.id, t.thresholds]),
    );

    // Assemble test cases with all nested data
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

    const { dashboard_url } = await deployDashboardMut({
      mxid: selectedCamera,
      streamName: selectedStream,
      dashboardConfig: {
        id: dashboardConfig.id,
        name: dashboardConfig.name,
        lineDirection: dashboardConfig.lineDirection,
        linePosition: dashboardConfig.linePosition,
        lineFlow: dashboardConfig.lineFlow,
        testCases: assembledTestCases,
        labels: projectLabels,
      },
      model: new File([modelBuffer], "model.tar.xz"),
      config: {
        type: "Generic",
        model_id: configModelId,
        nn_config: {},
      },
    }).unwrap();

    setDashboardUrl(`${cameraApiUrl}${dashboard_url}`);
  };

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

  const handleConfigChange = useCallback((configId: number | null) => {
    setActiveConfigId(configId);
  }, []);

  const hasCameras = cameras && cameras.length > 0;

  if (camerasLoading) {
    return (
      <Stack className={styles.pageWrapper} gap={0}>
        <RunSubheader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDeploy={handleDeploy}
          onStop={handleStop}
          isDeploying={isDeploying}
          canDeploy={false}
          isDeployed={!!dashboardUrl}
        />
        <SearchingForCamera />
      </Stack>
    );
  }

  if (!hasCameras) {
    return (
      <Stack className={styles.pageWrapper} gap={0}>
        <RunSubheader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDeploy={handleDeploy}
          onStop={handleStop}
          isDeploying={isDeploying}
          canDeploy={false}
          isDeployed={!!dashboardUrl}
        />
        <NoCameraDetected
          onRefresh={refetchCameras}
          isRefreshing={camerasFetching}
        />
      </Stack>
    );
  }

  return (
    <Stack className={styles.pageWrapper} gap={0}>
      <RunSubheader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDeploy={handleDeploy}
        onStop={handleStop}
        isDeploying={isDeploying}
        canDeploy={canDeploy}
        isDeployed={!!dashboardUrl}
      />
      <div className={styles.content}>
        {activeTab === "inference" && (
          <InferenceContent
            selectedCamera={selectedCamera}
            selectedStream={selectedStream}
            onGoToConfiguration={() => setActiveTab("configuration")}
          />
        )}
        {activeTab === "dashboard" && (
          <DashboardPage
            dashboardUrl={dashboardUrl}
            onConfigChange={handleConfigChange}
          />
        )}
        {activeTab === "configuration" && projectId && (
          <ConfigurationTab projectId={projectId} configId={activeConfigId} />
        )}
      </div>
    </Stack>
  );
};

const InferenceContent = ({
  selectedCamera,
  selectedStream,
  onGoToConfiguration,
}: {
  selectedCamera: string | null;
  selectedStream: string | null;
  onGoToConfiguration: () => void;
}) => {
  if (!selectedCamera || !selectedStream) {
    return (
      <Stack align="center" justify="center" className={styles.placeholder}>
        <div className={styles.placeholderIcon}>
          <Video />
        </div>
        <Text
          variant="text-16"
          weight="600"
          className={styles.placeholderTitle}
        >
          No live stream available
        </Text>
        <Text variant="text-14" className={styles.placeholderSubtitle}>
          Set up a camera and sensor in the Configuration tab, then deploy to
          see the live inference stream.
        </Text>
        <Button variant="outline" size="sm" onClick={onGoToConfiguration}>
          <Settings className="size-4" />
          Go to Configuration
        </Button>
      </Stack>
    );
  }

  return (
    <LiveInference
      selectedCamera={selectedCamera}
      selectedStream={selectedStream}
    />
  );
};
