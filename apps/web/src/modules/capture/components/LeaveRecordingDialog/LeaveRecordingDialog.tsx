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
import { useEffect, useState } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";
import { useVideoCapture } from "../../context/VideoCaptureContext";

/**
 * Intercepts in-app navigation while a video recording is active.
 * Shows a modal with three choices:
 *   • Cancel — stays on the page, keep recording.
 *   • Leave and discard — aborts the recorder, throws away the clip.
 *   • Leave and save — stops + uploads, waits for the upload to finish,
 *     then proceeds with navigation. Spinner while saving.
 *
 * Also installs a `beforeunload` handler so browser-level close/refresh
 * prompts the user. (We can't preserve the unsaved blob across a full page
 * reload, only nudge them to confirm.)
 */
export const LeaveRecordingDialog = () => {
  const { isRecording, stopAndSaveRecording, stopAndDiscardRecording } =
    useVideoCapture();
  const [saving, setSaving] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isRecording && currentLocation.pathname !== nextLocation.pathname,
  );

  // Warn on browser close/refresh while recording.
  useEffect(() => {
    if (!isRecording) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isRecording]);

  const open = blocker.state === "blocked";

  const handleCancel = () => {
    blocker.reset?.();
  };

  const handleDiscard = async () => {
    try {
      await stopAndDiscardRecording();
    } catch (e) {
      console.error("Failed to stop recording", e);
    }
    blocker.proceed?.();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await stopAndSaveRecording();
      blocker.proceed?.();
    } catch (e) {
      console.error("Failed to save recording before leaving", e);
      toast.error("Couldn't save the recording. You're still on this page — please try again.");
      // Keep the user on the page; the recording has already stopped so they
      // can retry via the regular pending-upload surface or leave & discard.
      blocker.reset?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex flex-row items-center gap-2">
            <TriangleAlert className="size-5 text-amber-500" />
            <DialogTitle>Recording in progress</DialogTitle>
          </div>
          <DialogDescription>
            A video is currently being recorded. Leaving this page will stop
            the recording. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDiscard}
            disabled={saving}
          >
            Leave and discard
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="size-4" />
                Saving…
              </>
            ) : (
              "Leave and save video"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
