import { Button } from "@repo/ui";
import { useVideoStream } from "../../hooks/useVideoStream";

import styles from "./VideoStream.module.scss";

export interface VideoStreamProps {
  selectedMxid: string;
  selectedSensorName: string;
}

export const VideoStream = ({
  selectedMxid,
  selectedSensorName,
}: VideoStreamProps) => {
  const { videoRef, seekToLive, isStreaming } = useVideoStream({
    selectedMxid,
    selectedSensorName,
  });

  return (
    <div>
      <video ref={videoRef} controls className={styles.video} muted />
      {!isStreaming && <Button onClick={seekToLive}>Seek to live</Button>}
    </div>
  );
};
