import { useListCamerasQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { DashboardPage } from "@/modules/dashboard";
import {
  useGetDashboardConfigQuery,
  useGetDashboardConfigsQuery,
} from "@/modules/dashboard/services/dashboardConfigApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { Stack, Text } from "@repo/ui";
import { Settings, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ConfigSelection } from "../../hooks/useRunDeploy";
import { useRunDeploy } from "../../hooks/useRunDeploy";
import { ConfigurationTab } from "../ConfigurationTab";
import { DeployConfigSelector } from "../DeployConfigSelector/DeployConfigSelector";
import { LiveInference } from "../LiveInference";
import { RunSubheader, RunTab } from "../RunSubheader";
import styles from "./RunPage.module.scss";

export const RunPage = () => {
  const [activeTab, setActiveTab] = useState<RunTab>("configuration");
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<ConfigSelection[]>([]);

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

  // Read camera/stream from persisted dashboard config
  const { data: dashboardConfig } = useGetDashboardConfigQuery(
    { projectId: projectId!, configId: activeConfigId! },
    { skip: !projectId || !activeConfigId },
  );

  const selectedCamera = dashboardConfig?.cameraMxid ?? null;
  const selectedStream = dashboardConfig?.streamName ?? null;
  const selectedCameraInfo = cameras?.find((c) => c.mxid === selectedCamera);

  const { handleDeploy, handleStop, isDeploying, dashboardUrl, canDeploy } =
    useRunDeploy({
      selectedCamera,
      selectedStream,
      selectedCameraInfo,
      activeConfigId,
      cameraApiUrl,
      selectedConfigs,
    });

  const configSelector = projectId ? (
    <DeployConfigSelector
      activeProjectId={projectId}
      activeConfigId={activeConfigId}
      selectedConfigs={selectedConfigs}
      onSelectionChange={setSelectedConfigs}
    />
  ) : undefined;

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
          configSelector={configSelector}
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
          configSelector={configSelector}
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
        configSelector={configSelector}
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
