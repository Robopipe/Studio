import { useRestartCameraMutation } from "@/core/cameraApi";
import { useAppDispatch } from "@/hooks/redux";
import { bumpPipeline } from "@/modules/camera-stream/services/cameraPipelineGenerationSlice";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useVideoCapture } from "../../context/VideoCaptureContext";

export interface RestartCameraButtonProps {
  mxid: string;
  streamName: string | null;
  isIntervalCapturing?: boolean;
  onBeforeRestart?: () => void;
}

export const RestartCameraButton = ({
  mxid,
  streamName,
  isIntervalCapturing = false,
  onBeforeRestart,
}: RestartCameraButtonProps) => {
  const [open, setOpen] = useState(false);
  const [restart, { isLoading }] = useRestartCameraMutation();
  const { isRecording, stopAndDiscardRecording } = useVideoCapture();
  const dispatch = useAppDispatch();

  const handleConfirm = async () => {
    onBeforeRestart?.();
    if (isRecording) {
      await stopAndDiscardRecording();
    }

    try {
      await restart({ mxid }).unwrap();
      if (streamName) {
        dispatch(bumpPipeline({ mxid, streamName }));
      }
      toast.success("Camera restarted");
      setOpen(false);
    } catch {
      toast.error("Failed to restart camera");
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Restart camera
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && !isLoading && setOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Restart camera?
            </DialogTitle>
            <DialogDescription>
              This will drop the live preview and reconnect. The camera will be
              unavailable for a few seconds.
              {isRecording && (
                <>
                  {" "}
                  You're currently recording. Restarting will discard the
                  in-progress recording.
                </>
              )}
              {isIntervalCapturing && (
                <>
                  {" "}
                  Interval shooting is in progress. Restarting will stop it.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Restarting…" : "Restart camera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
