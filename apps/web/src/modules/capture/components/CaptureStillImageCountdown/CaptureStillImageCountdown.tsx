import { Button } from "@repo/ui";
import { useEffect, useState } from "react";
import { useCountdown } from "usehooks-ts";
import { useCaptureImageFromCamera } from "../../hooks/useCaptureImageFromCamera";
import { IntervalShootingConfig } from "../CaptureStillImage/CaptureStillImage";

export interface CaptureStillImageCountdownProps {
  selectedCamera: string;
  selectedStream: string;
  intervalShootingConfig: IntervalShootingConfig;
}

export const CaptureStillImageCountdown = ({
  selectedCamera,
  selectedStream,
  intervalShootingConfig,
}: CaptureStillImageCountdownProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const { handleCaptureImage } = useCaptureImageFromCamera();
  const [count, { startCountdown, resetCountdown }] = useCountdown({
    countStart: intervalShootingConfig.numberOfImages,
    intervalMs: intervalShootingConfig.intervalSeconds * 1000,
  });

  useEffect(() => {
    if (count && isCapturing) {
      console.count("capture");

      void handleCaptureImage(selectedCamera, selectedStream);
    } else {
      setIsCapturing(false);
    }
  }, [count, isCapturing]);

  useEffect(() => {
    if (isCapturing) {
      startCountdown();
    } else {
      resetCountdown();
    }
  }, [isCapturing]);

  return (
    <Button
      onClick={() => setIsCapturing((x) => !x)}
      variant={isCapturing ? "outlined" : "filled"}
      size="lg"
    >
      {isCapturing ? "Stop capturing" : "Start capturing"}
    </Button>
  );
};
