import { useListCamerasQuery } from "@/core/cameraApi";
import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { DEFAULT_NN_RUNTIME_CONFIG } from "@/core/cameraApi/schemas/nn";
import { useCameraApiUrl } from "@/hooks";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import { DashboardPage } from "@/modules/dashboard";
import {
  useGetDashboardConfigQuery,
  useGetDashboardConfigsQuery,
} from "@/modules/dashboard/services/dashboardConfigApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { ReportsPage } from "@/modules/reports";
import {
  ConfigurationTab,
  RunSubheader,
  RunTab,
  type ConfigurationTabHandle,
} from "@/modules/run";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";
import type { ConfigSelection } from "../../hooks/useRunDeploy";
import { useRunDeploy } from "../../hooks/useRunDeploy";
import { DeployConfigSelector } from "../DeployConfigSelector/DeployConfigSelector";

export const RunPage = () => {
  const [activeTab, setActiveTab] = useState<RunTab>("inference");
  const [isReportExporting, setIsReportExporting] = useState(false);
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<ConfigSelection[]>([]);
  const [sahiConfig, setSahiConfig] = useState<SahiConfig | null>(null);
  const configTabRef = useRef<ConfigurationTabHandle>(null);

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

  const { data: cameras, isLoading: camerasLoading } = useListCamerasQuery();

  // Unified selection across Capture and Run — see useSelectedCameraStream.
  // The camera is the project's DB setting; the stream is session state
  // shared with Capture.
  const { cameraMxid: selectedCamera, streamName: selectedStream } =
    useSelectedCameraStream();

  const { data: dashboardConfig } = useGetDashboardConfigQuery(
    { projectId: projectId!, configId: activeConfigId! },
    { skip: !projectId || !activeConfigId },
  );

  const selectedCameraInfo = cameras?.find((c) => c.mxid === selectedCamera);

  const {
    handleDeploy,
    handleStop,
    isDeploying,
    deployPhase,
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
    activeProjectId: projectId ?? null,
    capturedVideoId: dashboardConfig?.capturedVideoId ?? null,
    cameraApiUrl,
    selectedConfigs,
    sahiConfig,
    runtimeConfig: DEFAULT_NN_RUNTIME_CONFIG,
    beforeDeploy: async () => {
      return await configTabRef.current?.saveIfDirty();
    },
  });

  const configSelector = projectId ? (
    <DeployConfigSelector
      activeProjectId={projectId}
      activeConfigId={activeConfigId}
      selectedConfigs={selectedConfigs}
      onSelectionChange={setSelectedConfigs}
    />
  ) : undefined;

  // Block in-app navigation while a deploy is in flight (bouncing the user
  // away mid-deploy can leave the camera in an inconsistent state) or while a
  // report export is generating (ReportsPage unmounting drops the download).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (isDeploying || isReportExporting) &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      toast.warning(
        isDeploying
          ? "Deployment in progress — please wait until it finishes."
          : "Export in progress — please wait until it finishes.",
      );
      blocker.reset?.();
    }
  }, [blocker, isDeploying]);

  useEffect(() => {
    if (!isDeploying && !isReportExporting) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDeploying, isReportExporting]);

  // The tabs are local state, invisible to the router blocker above — gate
  // them here so an in-flight export can't lose its Reports tab.
  const handleTabChange = useCallback(
    (tab: RunTab) => {
      if (isReportExporting && tab !== "reports") {
        toast.warning("Export in progress — please wait until it finishes.");
        return;
      }
      setActiveTab(tab);
    },
    [isReportExporting],
  );

  const handleConfigChange = useCallback((configId: number | null) => {
    setActiveConfigId(configId);
  }, []);

  const hasCameras = !!cameras && cameras.length > 0;
  const cameraReady = !camerasLoading && hasCameras;

  // Inference now owns the configuration controls (camera/sensor pickers,
  // model, zone, replay video) — the page falls back to a dataset preview
  // image when no camera/stream is selected, so it stays accessible without
  // a live device. Dashboard contains test-case and evaluation sub-tabs.
  const renderTabContent = () => {
    if (activeTab === "reports") {
      return (
        <ReportsPage
          dashboardId={activeConfigId}
          projectId={projectId ?? null}
          onExportingChange={setIsReportExporting}
        />
      );
    }

    if (activeTab === "dashboard") {
      return (
        <DashboardPage
          dashboardUrl={dashboardUrl}
          onConfigChange={handleConfigChange}
        />
      );
    }

    return projectId ? (
      <ConfigurationTab
        ref={configTabRef}
        projectId={projectId}
        configId={activeConfigId}
        sahiConfig={sahiConfig}
        onSahiConfigChange={setSahiConfig}
      />
    ) : null;
  };

  return (
    <div className="-m-6 flex min-h-0 flex-1 flex-col bg-white">
      <RunSubheader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onDeploy={handleDeploy}
        onStop={handleStop}
        deployPhase={deployPhase}
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
