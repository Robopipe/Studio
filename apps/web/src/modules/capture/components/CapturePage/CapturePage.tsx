import {
  useGetDashboardQuery,
  useListCamerasQuery,
} from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import { EditProjectModal } from "@/modules/project/components/EditProjectModal";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  ModelRunning,
  NoCameraDetected,
  SearchingForCamera,
} from "@/modules/ui";
import { useState } from "react";
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
  const { url: cameraApiUrl, isOverride } = useCameraApiUrl();
  const [activeProject] = useActiveProject();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    data: cameras,
    isLoading,
    refetch,
    isFetching,
  } = useListCamerasQuery(undefined, { skip: !cameraApiUrl });

  const {
    cameraMxid: selectedCamera,
    streamName: selectedStream,
    setCamera: handleSelectCamera,
    setStream: setSelectedStream,
  } = useSelectedCameraStream(cameras);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSwitchingStream, setIsSwitchingStream] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // isSuccess (not !!data) — RTK Query preserves the last successful body
  // across an error refetch, so checking `data` would keep the banner up
  // after Stop while the server now returns 404. isSuccess correctly
  // flips to false on a rejected refetch, matching useRunDeploy.
  const { isSuccess: isDashboardRunning, isLoading: isDashboardLoading } =
    useGetDashboardQuery(
      { mxid: selectedCamera!, streamName: selectedStream! },
      { skip: !selectedCamera || !selectedStream },
    );
  const isModelRunning = isDashboardRunning;
  const isCheckingModelStatus =
    !selectedCamera || !selectedStream || isDashboardLoading;

  const hasCameras = cameras && cameras.length > 0;

  const openSettings = activeProject
    ? () => setSettingsOpen(true)
    : undefined;

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

  if (!cameraApiUrl) {
    return renderNoCamera();
  }

  if (isLoading || isCheckingModelStatus) {
    return <SearchingForCamera url={cameraApiUrl} isOverride={isOverride} />;
  }

  if (!hasCameras) {
    return renderNoCamera();
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
        onSelectCamera={handleSelectCamera}
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
  onSelectCamera: (camera: string | null) => void;
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
  onSelectCamera,
  onSelectStream,
  onStreamSwitchingChange,
  onStreamingChange,
  onMediaStreamChange,
}: CapturePageBodyProps) => {
  const { isRecording } = useVideoCapture();

  return (
    <div className="-m-6 grid min-h-0 flex-1 grid-cols-[minmax(250px,1fr)_minmax(500px,2fr)_minmax(250px,1fr)] grid-rows-[minmax(0,1fr)] bg-white">
      <CaptureSettings
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        isStreaming={isStreaming && !isSwitchingStream}
        onSelectCamera={onSelectCamera}
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
      />
      <Captured />
    </div>
  );
};
