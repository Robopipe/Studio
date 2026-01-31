import { Button, Stack, Text } from "@repo/ui";
import { SelectCamera } from "../SelectCamera";
import { Orientation, SelectOrientation } from "../SelectOrientation";
import { SelectStream } from "../SelectStream";

import styles from "./CaptureSettings.module.scss";

export interface CaptureSettingsProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  selectedOrientation: Orientation | null;
  onSelectCamera: (camera: string | null) => void;
  onSelectStream: (stream: string | null) => void;
  onSelectOrientation: (orientation: Orientation | null) => void;
}

export const CaptureSettings = ({
  selectedCamera,
  selectedStream,
  selectedOrientation,
  onSelectCamera,
  onSelectStream,
  onSelectOrientation,
}: CaptureSettingsProps) => {
  return (
    <Stack className={styles.settings}>
      <Text variant="text-10" weight="700" className={styles.preTitle}>
        Capture Settings
      </Text>
      <SelectCamera value={selectedCamera} onSelect={onSelectCamera} />
      <SelectStream
        mxid={selectedCamera}
        value={selectedStream}
        onSelect={onSelectStream}
      />
      Name pattern
      <SelectOrientation
        value={selectedOrientation}
        onSelect={onSelectOrientation}
      />
      <Button>Start capturing</Button>
    </Stack>
  );
};
