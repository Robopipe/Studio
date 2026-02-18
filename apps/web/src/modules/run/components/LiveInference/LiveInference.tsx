import { useWebRTCStream } from "@/modules/capture/hooks/useWebRTCStream";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Stack, Text } from "@repo/ui";
import { useDetections } from "../../hooks/useDetections";
import { useDetectionsRenderer } from "../../hooks/useDetectionsRenderer";
import styles from "./LiveInference.module.scss";

export interface LiveInferenceProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedModelId: string | null;
  selectedOutputId: string | null;
}

export const LiveInference = ({
  selectedCamera,
  selectedStream,
  selectedModelId,
  selectedOutputId,
}: LiveInferenceProps) => {
  const canShowInference =
    selectedCamera && selectedStream && selectedModelId && selectedOutputId;
  const [activeProject] = useActiveProject();
  const { videoRef, isStreaming } = useWebRTCStream({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
  });
  const { canvasRef, renderDetections } = useDetectionsRenderer({
    videoRef,
    projectId: activeProject?.id || 0,
    modelId: Number(selectedModelId) || 0,
    enabled: !!canShowInference && !!selectedModelId && !!selectedOutputId,
  });
  const { detections, isConnected } = useDetections({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
    onDetections: renderDetections,
    enabled: !!canShowInference && !!selectedModelId && !!selectedOutputId,
  });

  if (!selectedCamera || !selectedStream) {
    return (
      <Stack className={styles.container} align="center" justify="center">
        <Text variant="text-16" className={styles.placeholder}>
          Select a camera and sensor to start streaming
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
        {canShowInference && isConnected && (
          <span className={styles.nnLabel}>NN</span>
        )}

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

      {!canShowInference && selectedCamera && selectedStream && (
        <Text variant="text-14" className={styles.hint}>
          Select a model and output type to see inference results
        </Text>
      )}
    </Stack>
  );
};
