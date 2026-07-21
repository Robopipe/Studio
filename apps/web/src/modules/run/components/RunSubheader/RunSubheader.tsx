import { Button } from "@/modules/shadcn/ui/button";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import { Play, Square } from "lucide-react";
import type { ReactNode } from "react";
import type { DeployPhase } from "../../hooks/useRunDeploy";

export type RunTab = "inference" | "dashboard" | "reports";

interface RunSubheaderProps {
  activeTab: RunTab;
  onTabChange: (tab: RunTab) => void;
  onDeploy: () => void;
  onStop: () => void;
  deployPhase: DeployPhase;
  canDeploy: boolean;
  isDeployed: boolean;
  configSelector?: ReactNode;
}

const TABS: { key: RunTab; label: string }[] = [
  { key: "inference", label: "Inference" },
  { key: "dashboard", label: "Control" },
  { key: "reports", label: "Reports" },
];

const PHASE_MESSAGES: Record<Exclude<DeployPhase, "idle">, string> = {
  preparing: "Saving configuration…",
  "loading-data": "Loading dashboard data…",
  "downloading-model": "Downloading model…",
  "uploading-video": "Uploading replay video…",
  "removing-video": "Removing replay video…",
  deploying: "Deploying to camera…",
  stopping: "Stopping dashboard…",
};

export const RunSubheader = ({
  activeTab,
  onTabChange,
  onDeploy,
  onStop,
  deployPhase,
  canDeploy,
  isDeployed,
  configSelector,
}: RunSubheaderProps) => {
  const isDeploying = deployPhase !== "idle";

  return (
    <div className="flex h-12 flex-shrink-0 items-end justify-between border-b border-border bg-gray-100 pr-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => v && onTabChange(v as RunTab)}
        className="gap-0"
      >
        <TabsList variant="line" className="border-b-0! px-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
        {configSelector}
        <div className="h-4 w-px bg-border" />
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
