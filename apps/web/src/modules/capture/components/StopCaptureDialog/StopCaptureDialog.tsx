import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useVideoCapture } from "../../context/VideoCaptureContext";

export interface StopCaptureDialogProps {
  open: boolean;
  isIntervalCapturing: boolean;
  onIntervalCapturingChange: (value: boolean) => void;
  /** Called with true when capture was stopped and the switch may proceed. */
  onClose: (proceed: boolean) => void;
}

/**
 * Confirms switching the camera or stream while a capture is running.
 * Confirming stops interval shooting and/or stops + saves the recording
 * (waiting for the upload, like `LeaveRecordingDialog`), then resolves the
 * held switch. Cancelling leaves the capture untouched.
 */
export const StopCaptureDialog = ({
  open,
  isIntervalCapturing,
  onIntervalCapturingChange,
  onClose,
}: StopCaptureDialogProps) => {
  const { isRecording, stopAndSaveRecording } = useVideoCapture();
  const [saving, setSaving] = useState(false);

  // isRecording flips false as soon as the recorder stops, before the upload
  // finishes — keep the recording copy up while the save is in flight.
  const showRecording = isRecording || saving;

  const handleConfirm = async () => {
    if (isRecording) {
      setSaving(true);
      try {
        await stopAndSaveRecording();
      } catch (e) {
        console.error("Failed to save recording before switching", e);
        toast.error("Couldn't save the recording. The switch was cancelled.");
        onClose(false);
        return;
      } finally {
        setSaving(false);
      }
    }
    if (isIntervalCapturing) {
      onIntervalCapturingChange(false);
    }
    onClose(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose(false);
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex flex-row items-center gap-2">
            <TriangleAlert className="size-5 text-amber-500" />
            <DialogTitle>
              {showRecording
                ? "Recording in progress"
                : "Interval shooting in progress"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {showRecording
              ? "Switching will stop the current recording. The video will be saved."
              : "Switching will stop the interval shooting."}
            {showRecording &&
              isIntervalCapturing &&
              " Interval shooting will be stopped too."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="size-4" />
                Saving…
              </>
            ) : (
              "Stop and switch"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
