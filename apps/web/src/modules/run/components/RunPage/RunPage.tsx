import { useListCamerasQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { DashboardPage } from "@/modules/dashboard";
import {
  useGetDashboardConfigQuery,
  useGetDashboardConfigsQuery,
} from "@/modules/dashboard/services/dashboardConfigApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { Settings, TriangleAlert, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ConfigSelection } from "../../hooks/useRunDeploy";
import { useRunDeploy } from "../../hooks/useRunDeploy";
import { ConfigurationTab } from "../ConfigurationTab";
import { DeployConfigSelector } from "../DeployConfigSelector/DeployConfigSelector";
import { LiveInference } from "../LiveInference";
import { RunSubheader, RunTab } from "../RunSubheader";

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

  const {
    handleDeploy,
    handleStop,
    isDeploying,
    dashboardUrl,
    canDeploy,
    showDeployConfirm,
    handleConfirmDeploy,
    handleCancelDeploy,
  } = useRunDeploy({
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

  const hasCameras = !!cameras && cameras.length > 0;
  const cameraReady = !camerasLoading && hasCameras;

  // Configuration is where you set up the camera, so it's always accessible.
  // Dashboard contains test-case and evaluation sub-tabs that don't depend on
  // a live camera (the Custom dashboard sub-tab shows its own "not running"
  // placeholder when no deployed URL is available). Only Inference truly
  // requires a connected camera for the live video stream.
  const renderTabContent = () => {
    if (activeTab === "configuration") {
      return projectId ? (
        <ConfigurationTab projectId={projectId} configId={activeConfigId} />
      ) : null;
    }

    if (activeTab === "dashboard") {
      return (
        <DashboardPage
          dashboardUrl={dashboardUrl}
          onConfigChange={handleConfigChange}
        />
      );
    }

    // inference
    if (camerasLoading) {
      return <SearchingForCamera />;
    }

    if (!hasCameras) {
      return (
        <NoCameraDetected
          onRefresh={refetchCameras}
          isRefreshing={camerasFetching}
        />
      );
    }

    return (
      <InferenceContent
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        onGoToConfiguration={() => setActiveTab("configuration")}
      />
    );
  };

  return (
    <div className="-m-6 flex min-h-0 flex-1 flex-col bg-white">
      <RunSubheader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDeploy={handleDeploy}
        onStop={handleStop}
        isDeploying={isDeploying}
        canDeploy={cameraReady && canDeploy}
        isDeployed={!!dashboardUrl}
        configSelector={configSelector}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {renderTabContent()}
      </div>

      <DeployConfirmDialog
        open={showDeployConfirm}
        onConfirm={handleConfirmDeploy}
        onCancel={handleCancelDeploy}
      />
    </div>
  );
};

const DeployConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <div className="flex flex-row items-center gap-2">
          <TriangleAlert className="size-5 text-amber-500" />
          <DialogTitle>Dashboard already running</DialogTitle>
        </div>
        <DialogDescription>
          There is already a dashboard running. Deploying again will override
          the current configuration.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Deploy anyway</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

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
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/5 [&_svg]:size-7 [&_svg]:text-black/30">
          <Video />
        </div>
        <p className="mb-2 text-base text-black/85">No live stream available</p>
        <p className="mb-6 max-w-[360px] text-center text-sm text-black/45">
          Set up a camera and sensor in the Configuration tab, then deploy to
          see the live inference stream.
        </p>
        <Button variant="outline" size="sm" onClick={onGoToConfiguration}>
          <Settings className="size-4" />
          Go to Configuration
        </Button>
      </div>
    );
  }

  return (
    <LiveInference
      selectedCamera={selectedCamera}
      selectedStream={selectedStream}
    />
  );
};
