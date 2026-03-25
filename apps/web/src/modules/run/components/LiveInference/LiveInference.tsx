import { useGetNNQuery } from "@/core/cameraApi/api";
import { useWebRTCStream } from "@/modules/capture/hooks/useWebRTCStream";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Stack, Text } from "@repo/ui";
import { useDetections } from "../../hooks/useDetections";
import { useDetectionsRenderer } from "../../hooks/useDetectionsRenderer";
import styles from "./LiveInference.module.scss";

export interface LiveInferenceProps {
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const LiveInference = ({
  selectedCamera,
  selectedStream,
}: LiveInferenceProps) => {
  const { data: nnInfo } = useGetNNQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );
  const modelId = nnInfo?.model_id ?? 0;
  const hasNN = !!nnInfo?.model_id;

  const [activeProject] = useActiveProject();
  const { videoRef, isStreaming } = useWebRTCStream({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
  });
  const { canvasRef, renderDetections } = useDetectionsRenderer({
    videoRef,
    projectId: activeProject?.id || 0,
    modelId,
    enabled: hasNN,
  });
  const { isConnected } = useDetections({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
    onDetections: renderDetections,
    enabled: hasNN && !!nnInfo,
  });

  if (!selectedCamera || !selectedStream) {
    return (
      <Stack className={styles.container} align="center" justify="center">
        <Text variant="text-16" className={styles.placeholder}>
          Configure a camera and sensor in the Configuration tab
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={16} className={styles.container}>
      <Text variant="text-20" weight="600">
        Live stream
      </Text>

      <div className={styles.videoWrapper}>
        {isStreaming && <span className={styles.liveLabel}>LIVE</span>}
        {hasNN && isConnected && <span className={styles.nnLabel}>NN</span>}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.stream}
        />

        {!isStreaming && (
          <div className={styles.streamPlaceholder}>
            Connecting to camera...
          </div>
        )}

        <canvas ref={canvasRef} className={styles.detectionsOverlay} />
      </div>

      {!hasNN && (
        <Text variant="text-14" className={styles.hint}>
          Deploy to see inference results
        </Text>
      )}
    </Stack>
  );
};
