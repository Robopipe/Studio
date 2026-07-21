import { useGetNNQuery, useListCamerasQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { useAppDispatch } from "@/hooks/redux";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import { bumpPipeline } from "@/modules/camera-stream/services/cameraPipelineGenerationSlice";
import { EditProjectModal } from "@/modules/project/components/EditProjectModal";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  ModelRunning,
  NoCameraConfigured,
  NoCameraDetected,
  SearchingForCamera,
} from "@/modules/ui";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  useVideoCapture,
  VideoCaptureProvider,
} from "../../context/VideoCaptureContext";
import { Captured } from "../Captured";
import { CaptureSettings } from "../CaptureSettings";
import { LeaveRecordingDialog } from "../LeaveRecordingDialog";
import { LiveCapture } from "../LiveCapture";

export interface CapturePageProps {}

export const CapturePage = ({}: CapturePageProps) => {
  const cameraApiUrl = useCameraApiUrl();
  const [activeProject] = useActiveProject();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const isSwitchingProject =
    !activeProject || String(activeProject.id) !== urlProjectId;
  const dispatch = useAppDispatch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    data: cameras,
    isLoading,
    refetch,
    isFetching,
  } = useListCamerasQuery(undefined, {
    skip: !cameraApiUrl || isSwitchingProject,
  });

  const {
    cameraMxid: selectedCamera,
    streamName: selectedStream,
    setStream: setSelectedStream,
  } = useSelectedCameraStream();

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSwitchingStream, setIsSwitchingStream] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const hasLoadedDashboardOnceRef = useRef(false);

  // When cameras transitions from unavailable (empty array OR network error)
  // to available, bump the pipeline so CameraStreamProvider retries the WebRTC
  // connection. Without this, if the same mxid/streamName stays selected (stale
  // state from the failed connection attempt), the provider's deps don't change
  // and it never reconnects. We guard on !isLoading so the initial load
  // (undefined → data) doesn't mistakenly trigger a bump.
  const hadNoCameraRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    const hasCamerasNow = !!(cameras && cameras.length > 0);
    if (!hasCamerasNow) {
      hadNoCameraRef.current = true;
      return;
    }
    if (hadNoCameraRef.current && selectedCamera && selectedStream) {
      hadNoCameraRef.current = false;
      dispatch(
        bumpPipeline({ mxid: selectedCamera, streamName: selectedStream }),
      );
    }
  }, [cameras, isLoading, selectedCamera, selectedStream, dispatch]);

  // isSuccess (not !!data) — RTK Query preserves the last successful body
  // across an error refetch, so checking `data` would keep the banner up
  // after Stop while the server now returns 404. isSuccess correctly
  // flips to false on a rejected refetch, matching useRunDeploy.
  const {
    data: isModelRunning,
    isLoading: isModelLoading,
    isError: isModelError,
  } = useGetNNQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream || isSwitchingProject, refetchOnMountOrArgChange: true },
  );
  useEffect(() => {
    if (isModelRunning || isModelError)
      hasLoadedDashboardOnceRef.current = true;
  }, [isModelRunning, isModelError]);

  const isInitialModelLoad =
    isModelLoading && !hasLoadedDashboardOnceRef.current;

  const hasCameras = cameras && cameras.length > 0;

  const openSettings = activeProject ? () => setSettingsOpen(true) : undefined;

  const renderNoCamera = () => (
    <>
      <NoCameraDetected
        onRefresh={refetch}
        isRefreshing={isFetching}
        onOpenSettings={openSettings}
      />
      {settingsOpen && activeProject && (
        <EditProjectModal
          project={activeProject}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );

  const renderNoCameraConfigured = () => (
    <>
      <NoCameraConfigured onOpenSettings={openSettings} />
      {settingsOpen && activeProject && (
        <EditProjectModal
          project={activeProject}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );

  if (isSwitchingProject) {
    return <SearchingForCamera />;
  }

  if (!cameraApiUrl) {
    return renderNoCamera();
  }

  if (isLoading) {
    return <SearchingForCamera url={cameraApiUrl} />;
  }

  if (!hasCameras) {
    return renderNoCamera();
  }

  // Cameras detected but the project has no camera set — deliberately no
  // fallback: the camera is picked explicitly in the project settings.
  if (!selectedCamera) {
    return renderNoCameraConfigured();
  }

  // Stream auto-pick pending, or the saved camera isn't reachable (stale
  // mxid: streams never load). Also covers the initial model-status load.
  if (!selectedStream || isInitialModelLoad) {
    return <SearchingForCamera url={cameraApiUrl} />;
  }

  if (isModelRunning && activeProject) {
    return <ModelRunning projectId={activeProject.id} />;
  }

  return (
    <VideoCaptureProvider
      mediaStream={mediaStream}
      projectId={activeProject?.id ?? null}
    >
      <CapturePageBody
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        isStreaming={isStreaming}
        isSwitchingStream={isSwitchingStream}
        mediaStream={mediaStream}
        onSelectStream={setSelectedStream}
        onStreamSwitchingChange={setIsSwitchingStream}
        onStreamingChange={setIsStreaming}
        onMediaStreamChange={setMediaStream}
      />
      <LeaveRecordingDialog />
    </VideoCaptureProvider>
  );
};

interface CapturePageBodyProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  isStreaming: boolean;
  isSwitchingStream: boolean;
  mediaStream: MediaStream | null;
  onSelectStream: (stream: string | null) => void;
  onStreamSwitchingChange: (isSwitching: boolean) => void;
  onStreamingChange: (isStreaming: boolean) => void;
  onMediaStreamChange: (stream: MediaStream | null) => void;
}

// Split so we can read recording state from context without violating the
// "can't useContext in the same component that renders its Provider" rule.
const CapturePageBody = ({
  selectedCamera,
  selectedStream,
  isStreaming,
  isSwitchingStream,
  mediaStream,
  onSelectStream,
  onStreamSwitchingChange,
  onStreamingChange,
  onMediaStreamChange,
}: CapturePageBodyProps) => {
  const { isRecording } = useVideoCapture();
  const [isIntervalCapturing, setIsIntervalCapturing] = useState(false);

  return (
    <div className="-m-6 grid min-h-0 flex-1 grid-cols-[minmax(250px,1fr)_minmax(500px,2fr)_minmax(250px,1fr)] grid-rows-[minmax(0,1fr)] bg-white">
      <CaptureSettings
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        isStreaming={isStreaming && !isSwitchingStream}
        isIntervalCapturing={isIntervalCapturing}
        onIntervalCapturingChange={setIsIntervalCapturing}
        onSelectStream={onSelectStream}
        onStreamSwitchingChange={onStreamSwitchingChange}
        mediaStream={mediaStream}
      />
      <LiveCapture
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        isSwitchingStream={isSwitchingStream}
        onStreamingChange={onStreamingChange}
        onMediaStreamChange={onMediaStreamChange}
        isRecording={isRecording}
        isIntervalCapturing={isIntervalCapturing}
        onIntervalCapturingChange={setIsIntervalCapturing}
      />
      <Captured />
    </div>
  );
};
