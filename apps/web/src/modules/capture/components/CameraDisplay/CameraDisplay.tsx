import { useWebRTCStream } from "../../hooks/useWebRTCStream";

import styles from "./CameraDisplay.module.scss";

interface CameraDisplayProps {
  selectedMxid: string;
  selectedSensorName: string;
}

export const CameraDisplay = ({
  selectedMxid,
  selectedSensorName,
}: CameraDisplayProps) => {
  const { videoRef, isStreaming, error } = useWebRTCStream({
    selectedMxid,
    selectedSensorName,
  });

  return (
    <div className={styles.container}>
      {isStreaming && <span className={styles.liveLabel}>LIVE</span>}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={styles.stream}
      ></video>

      {!isStreaming && !error && (
        <div className={styles.placeholder}>Connecting to camera...</div>
      )}
      {error && (
        <div className={styles.placeholder} style={{ color: "red" }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};
