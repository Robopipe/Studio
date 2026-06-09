import { Button } from "@/modules/shadcn/ui/button";
import { useEffect } from "react";
import { useCountdown } from "usehooks-ts";
import { useCaptureImageFromCamera } from "../../hooks/useCaptureImageFromCamera";
import { IntervalShootingConfig } from "../CaptureStillImage/CaptureStillImage";

export interface CaptureStillImageCountdownProps {
  selectedCamera: string;
  selectedStream: string | null;
  isStreaming: boolean;
  intervalShootingConfig: IntervalShootingConfig;
  isCapturing: boolean;
  onIsCapturingChange: (value: boolean) => void;
}

export const CaptureStillImageCountdown = ({
  selectedCamera,
  selectedStream,
  isStreaming,
  intervalShootingConfig,
  isCapturing,
  onIsCapturingChange,
}: CaptureStillImageCountdownProps) => {
  const { handleCaptureImage } = useCaptureImageFromCamera();
  const [count, { startCountdown, resetCountdown }] = useCountdown({
    countStart: intervalShootingConfig.numberOfImages,
    intervalMs: intervalShootingConfig.intervalSeconds * 1000,
  });

  useEffect(() => {
    if (!isCapturing) return;
    if (count === 0) {
      onIsCapturingChange(false);
      return;
    }
    if (!selectedStream) return;
    void handleCaptureImage(selectedCamera, selectedStream);
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
      onClick={() => onIsCapturingChange(!isCapturing)}
      variant={isCapturing ? "outline" : "default"}
      disabled={!selectedStream || !isStreaming}
      size="lg"
    >
      {isCapturing ? "Stop capturing" : "Start capturing"}
    </Button>
  );
};
