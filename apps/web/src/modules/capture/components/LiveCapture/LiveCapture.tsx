import { Stack, Text } from "@repo/ui";
import { VideoStream } from "../VideoStream";

import styles from "./LiveCapture.module.scss";

export interface LiveCaptureProps {
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const LiveCapture = ({
  selectedCamera,
  selectedStream,
}: LiveCaptureProps) => {
  return (
    <Stack gap="md" className={styles.liveCapture}>
      <Text variant="text-20" weight="600">
        Capture images live
      </Text>

      {selectedCamera && selectedStream && (
        <VideoStream
          selectedMxid={selectedCamera}
          selectedSensorName={selectedStream}
        />
      )}
    </Stack>
  );
};
