import { Button } from "@/modules/shadcn/ui/button";
import { Camera } from "lucide-react";

export interface NoCameraConfiguredProps {
  onOpenSettings?: () => void;
}

/**
 * Cameras were detected at the project's camera API URL, but the project has
 * no camera configured (project.cameraMxid is null). There is deliberately no
 * fallback — the camera must be picked explicitly in the project settings.
 */
export const NoCameraConfigured = ({
  onOpenSettings,
}: NoCameraConfiguredProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
        <Camera className="size-8 text-black/60" />
      </div>

      <p className="mb-2 text-xl font-semibold text-black">
        No camera configured
      </p>

      <p className="mb-6 text-sm text-black/60">
        Cameras were detected, but this project doesn&apos;t have a camera
        configured yet.
      </p>

      {onOpenSettings && (
        <Button onClick={onOpenSettings} className="mb-8">
          Select camera in project settings
        </Button>
      )}

      <a
        href="https://robopipe.gitbook.io/doc/getting-started/connection"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm text-primary hover:underline"
      >
        Learn more how to connect camera
      </a>
    </div>
  );
};
