import { useListCamerasQuery } from "@/core/cameraApi";
import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { DEFAULT_NN_RUNTIME_CONFIG } from "@/core/cameraApi/schemas/nn";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  ConfigurationTab,
  RunSubheader,
  type ConfigurationTabHandle,
} from "@/modules/run";
import { useGetRunConfigQuery } from "@/modules/run/services/runConfigApi";
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
import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";
import { useRunDeploy } from "../../hooks/useRunDeploy";

export const RunPage = () => {
  const [sahiConfig, setSahiConfig] = useState<SahiConfig | null>(null);
  const configTabRef = useRef<ConfigurationTabHandle>(null);

  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const { data: cameras, isLoading: camerasLoading } = useListCamerasQuery();

  // Unified selection across Capture and Run — see useSelectedCameraStream.
  // The camera is the project's DB setting; the stream is session state
  // shared with Capture.
  const { cameraMxid: selectedCamera, streamName: selectedStream } =
    useSelectedCameraStream();

  const { data: runConfig } = useGetRunConfigQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const selectedCameraInfo = cameras?.find((c) => c.mxid === selectedCamera);

  const {
    handleDeploy,
    handleStop,
    isDeploying,
    deployPhase,
    canDeploy,
    isDeployed,
    showDeployConfirm,
    handleConfirmDeploy,
    handleCancelDeploy,
  } = useRunDeploy({
    selectedCamera,
    selectedStream,
    selectedCameraInfo,
    projectId: projectId ?? null,
    modelId: runConfig?.modelId ?? null,
    capturedVideoId: runConfig?.capturedVideoId ?? null,
    sahiConfig,
    runtimeConfig: DEFAULT_NN_RUNTIME_CONFIG,
    beforeDeploy: async () => {
      return await configTabRef.current?.saveIfDirty();
    },
  });

  // Block in-app navigation while a deploy is in flight (bouncing the user
  // away mid-deploy can leave the camera in an inconsistent state).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDeploying && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      toast.warning("Deployment in progress — please wait until it finishes.");
      blocker.reset?.();
    }
  }, [blocker]);

  useEffect(() => {
    if (!isDeploying) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDeploying]);

  const hasCameras = !!cameras && cameras.length > 0;
  const cameraReady = !camerasLoading && hasCameras;

  return (
    <div className="-m-6 flex min-h-0 flex-1 flex-col bg-white">
      <RunSubheader
        onDeploy={handleDeploy}
        onStop={handleStop}
        deployPhase={deployPhase}
        canDeploy={cameraReady && canDeploy}
        isDeployed={isDeployed}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {projectId ? (
          <ConfigurationTab
            ref={configTabRef}
            projectId={projectId}
            sahiConfig={sahiConfig}
            onSahiConfigChange={setSahiConfig}
          />
        ) : null}
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
          <DialogTitle>Model already running</DialogTitle>
        </div>
        <DialogDescription>
          There is already a model running. Deploying again will override the
          current configuration.
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
