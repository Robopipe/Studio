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

interface LeaveAnnotationsDialogProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

/**
 * Intercepts navigation while the label page has unsaved annotation edits.
 * Blocks pathname changes AND `?task=` changes — the latter is critical
 * because switching tasks via DataSourcePanel / pagination is a search-
 * param navigation that would otherwise silently overwrite local edits
 * once the new task's detail query resolves.
 */
export const LeaveAnnotationsDialog = ({
  isDirty,
  isSaving,
  onSave,
}: LeaveAnnotationsDialogProps) => {
  const [saving, setSaving] = useState(false);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!isDirty || isSaving) return false;
    if (currentLocation.pathname !== nextLocation.pathname) return true;
    const currentTask = new URLSearchParams(currentLocation.search).get("task");
    const nextTask = new URLSearchParams(nextLocation.search).get("task");
    return currentTask !== nextTask;
  });

  useEffect(() => {
    if (!isDirty || isSaving) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, isSaving]);

  const open = blocker.state === "blocked";

  const handleCancel = () => {
    blocker.reset?.();
  };

  const handleDiscard = () => {
    blocker.proceed?.();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      blocker.proceed?.();
    } catch (e) {
      console.error("Failed to save annotations before leaving", e);
      toast.error("Couldn't save annotations. You're still on this page — please try again.");
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
            <DialogTitle>Unsaved annotations</DialogTitle>
          </div>
          <DialogDescription>
            You have unsaved annotations on this task. Leaving now will
            discard them. What would you like to do?
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
              "Save and leave"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
