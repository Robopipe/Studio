import { useListCamerasQuery } from "@/core/cameraApi";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

export interface SelectedCameraFieldProps {
  cameraMxid: string | null;
  className?: string;
}

/**
 * Read-only indicator of the centrally-selected camera. The camera is a
 * project-modal setting — change it via the project's edit dialog.
 */
export const SelectedCameraField = ({
  cameraMxid,
  className,
}: SelectedCameraFieldProps) => {
  const { data: cameras } = useListCamerasQuery();

  const camera = cameras?.find((c) => c.mxid === cameraMxid);
  const label =
    cameraMxid == null
      ? "No camera selected"
      : (camera?.camera_name ??
        (cameras ? `${cameraMxid} (not detected)` : cameraMxid));

  return (
    <div
      className={cn(
        "flex h-9 min-w-0 items-center gap-2 rounded-md border border-input bg-gray-100 px-3.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <Camera className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
};
