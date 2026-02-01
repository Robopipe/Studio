import { useMJPEGStream } from "../../hooks/useMJPEGStream";

import styles from "./CameraDisplay.module.scss";

interface CameraDisplayProps {
  selectedMxid: string;
  selectedSensorName: string;
}

export const CameraDisplay = ({
  selectedMxid,
  selectedSensorName,
}: CameraDisplayProps) => {
  const { imageRef, isStreaming } = useMJPEGStream({
    selectedMxid,
    selectedSensorName,
  });

  return (
    <div className={styles.container}>
      {isStreaming && <span className={styles.liveLabel}>LIVE</span>}

      <img ref={imageRef} className={styles.stream} alt="Camera Feed" />

      {!isStreaming && (
        <div className={styles.placeholder}>Connecting to camera...</div>
      )}
    </div>
  );
};
