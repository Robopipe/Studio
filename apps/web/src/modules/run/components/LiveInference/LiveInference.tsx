import { useMJPEGStream } from "@/modules/capture/hooks/useMJPEGStream";
import { Stack, Text } from "@repo/ui";
import { useEffect, useState } from "react";
import styles from "./LiveInference.module.scss";

export interface LiveInferenceProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedModelId: string | null;
  selectedOutputId: string | null;
}

interface MockDetection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

const generateMockDetections = (): MockDetection[] => {
  const count = Math.floor(Math.random() * 15) + 10;
  const detections: MockDetection[] = [];

  for (let i = 0; i < count; i++) {
    detections.push({
      id: i,
      x: Math.random() * 80,
      y: Math.random() * 80,
      width: Math.random() * 8 + 4,
      height: Math.random() * 8 + 4,
      label: `obj_${i}`,
      confidence: Math.random() * 0.3 + 0.7,
    });
  }

  return detections;
};

export const LiveInference = ({
  selectedCamera,
  selectedStream,
  selectedModelId,
  selectedOutputId,
}: LiveInferenceProps) => {
  const [mockDetections, setMockDetections] = useState<MockDetection[]>([]);

  const canShowInference =
    selectedCamera && selectedStream && selectedModelId && selectedOutputId;

  const { imageRef, isStreaming } = useMJPEGStream({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
  });

  useEffect(() => {
    if (!canShowInference) {
      setMockDetections([]);
      return;
    }

    setMockDetections(generateMockDetections());

    const interval = setInterval(() => {
      setMockDetections(generateMockDetections());
    }, 2000);

    return () => clearInterval(interval);
  }, [canShowInference]);

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

        <img ref={imageRef} className={styles.stream} alt="Camera Feed" />

        {!isStreaming && (
          <div className={styles.streamPlaceholder}>Connecting to camera...</div>
        )}

        {canShowInference && (
          <div className={styles.detectionsOverlay}>
            {mockDetections.map((detection) => (
              <div
                key={detection.id}
                className={styles.boundingBox}
                style={{
                  left: `${detection.x}%`,
                  top: `${detection.y}%`,
                  width: `${detection.width}%`,
                  height: `${detection.height}%`,
                }}
              >
                <span className={styles.label}>
                  {Math.round(detection.confidence * 100)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!canShowInference && selectedCamera && selectedStream && (
        <Text variant="text-14" className={styles.hint}>
          Select a model and output type to see inference results
        </Text>
      )}
    </Stack>
  );
};
