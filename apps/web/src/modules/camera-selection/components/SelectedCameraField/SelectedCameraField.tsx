import { useListCamerasQuery } from "@/core/cameraApi";
import { cn } from "@/lib/utils";
// Deep imports, not the project barrel — keeps project ↔ camera-selection
// barrels acyclic (same precedent as useSelectedCameraStream).
import { EditProjectModal } from "@/modules/project/components/EditProjectModal";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { Camera, Pencil } from "lucide-react";
import { useState } from "react";

export interface SelectedCameraFieldProps {
  cameraMxid: string | null;
  /**
   * Guard forwarded to EditProjectModal: invoked before applying a CHANGED
   * camera on save; resolving false aborts the save. Used on Capture to
   * confirm stopping an active recording. Omit on pages where nothing can
   * be recording.
   */
  confirmCameraChange?: () => Promise<boolean>;
  className?: string;
}

/**
 * Read-only indicator of the centrally-selected camera. The camera is a
 * project-modal setting — this field shows which camera is live and offers
 * a shortcut into the edit modal to change it.
 */
export const SelectedCameraField = ({
  cameraMxid,
  confirmCameraChange,
  className,
}: SelectedCameraFieldProps) => {
  const { data: cameras } = useListCamerasQuery();
  const [activeProject] = useActiveProject();
  const [editOpen, setEditOpen] = useState(false);

  const camera = cameras?.find((c) => c.mxid === cameraMxid);
  const label =
    cameraMxid == null
      ? "No camera selected"
      : (camera?.camera_name ??
        (cameras ? `${cameraMxid} (not detected)` : cameraMxid));

  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-gray-100 px-3.5 text-sm text-muted-foreground">
        <Camera className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      {activeProject && (
        <Button
          variant="outline"
          size="sm"
          aria-label="Change camera"
          title="Change camera"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
      )}
      {editOpen && activeProject && (
        <EditProjectModal
          project={activeProject}
          initialTabId="details"
          confirmCameraChange={confirmCameraChange}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
};
