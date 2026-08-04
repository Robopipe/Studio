import { Button } from "@/modules/shadcn/ui/button";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Play, Square } from "lucide-react";
import type { DeployPhase } from "../../hooks/useRunDeploy";

interface RunSubheaderProps {
  onDeploy: () => void;
  onStop: () => void;
  deployPhase: DeployPhase;
  canDeploy: boolean;
  isDeployed: boolean;
}

const PHASE_MESSAGES: Record<Exclude<DeployPhase, "idle">, string> = {
  preparing: "Saving configuration…",
  "loading-data": "Loading model data…",
  "downloading-model": "Downloading model…",
  "uploading-video": "Uploading replay video…",
  "removing-video": "Removing replay video…",
  deploying: "Deploying to camera…",
  stopping: "Stopping model…",
};

export const RunSubheader = ({
  onDeploy,
  onStop,
  deployPhase,
  canDeploy,
  isDeployed,
}: RunSubheaderProps) => {
  const isDeploying = deployPhase !== "idle";

  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-gray-100 pr-6">
      <span className="px-6 text-sm font-medium">Inference</span>

      <div className="flex h-full items-center gap-2">
        {isDeploying && (
          <>
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Spinner className="size-4 text-emerald-500" />
              <span>{PHASE_MESSAGES[deployPhase]}</span>
            </div>
            <div className="h-4 w-px bg-border" />
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isDeployed || isDeploying}
        >
          <Square className="size-4" />
          Stop
        </Button>
        <Button
          size="sm"
          onClick={onDeploy}
          disabled={!canDeploy || isDeploying}
        >
          <Play className="size-4" />
          Deploy
        </Button>
      </div>
    </div>
  );
};
