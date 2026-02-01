import { Stack, Text } from "@repo/ui";
import { CameraDisplay } from "../CameraDisplay";
import { ImageProfile } from "../ImageProfile";

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
      <Text variant="text-20" weight="700">
        Capture images live
      </Text>

      {selectedCamera && selectedStream && (
        <>
          <CameraDisplay
            selectedMxid={selectedCamera}
            selectedSensorName={selectedStream}
          />

          <ImageProfile
            selectedCamera={selectedCamera}
            selectedStream={selectedStream}
          />
        </>
      )}
    </Stack>
  );
};
