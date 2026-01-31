import { useState } from "react";
import { Captured } from "../Captured";
import { CaptureSettings } from "../CaptureSettings";

import { LiveCapture } from "../LiveCapture";
import { Orientation } from "../SelectOrientation";
import styles from "./CapturePage.module.scss";

export interface CapturePageProps {}

export const CapturePage = ({}: CapturePageProps) => {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedOrientation, setSelectedOrientation] =
    useState<Orientation | null>("horizontal");

  return (
    <div className={styles.page}>
      <CaptureSettings
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        selectedOrientation={selectedOrientation}
        onSelectCamera={setSelectedCamera}
        onSelectStream={setSelectedStream}
        onSelectOrientation={setSelectedOrientation}
      />
      <LiveCapture
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
      />
      <Captured />
    </div>
  );
};
