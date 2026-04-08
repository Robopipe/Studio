import { cn } from "@/lib/utils";
import { Button } from "@/modules/shadcn/ui/button";
import { Play, Square } from "lucide-react";
import type { ReactNode } from "react";

export type RunTab = "inference" | "dashboard" | "configuration";

interface RunSubheaderProps {
  activeTab: RunTab;
  onTabChange: (tab: RunTab) => void;
  onDeploy: () => void;
  onStop: () => void;
  isDeploying: boolean;
  canDeploy: boolean;
  isDeployed: boolean;
  configSelector?: ReactNode;
}

const TABS: { key: RunTab; label: string }[] = [
  { key: "inference", label: "Inference" },
  { key: "dashboard", label: "Dashboard" },
  { key: "configuration", label: "Configuration" },
];

export const RunSubheader = ({
  activeTab,
  onTabChange,
  onDeploy,
  onStop,
  isDeploying,
  canDeploy,
  isDeployed,
  configSelector,
}: RunSubheaderProps) => {
  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-black/10 bg-gray-100 px-6">
      <div className="flex flex-row items-center gap-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cn(
              "relative cursor-pointer border-none bg-none px-0 py-3 text-gray-500 hover:text-gray-700",
              activeTab === tab.key &&
                "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:content-['']"
            )}
            onClick={() => onTabChange(tab.key)}
          >
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {configSelector}
        <div className="h-4 w-px bg-gray-200" />
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isDeployed}
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
          {isDeploying ? "Deploying..." : "Deploy"}
        </Button>
      </div>
    </div>
  );
};
