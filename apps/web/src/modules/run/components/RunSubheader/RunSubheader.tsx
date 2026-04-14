import { Button } from "@/modules/shadcn/ui/button";
import { TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
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
    <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-gray-100 pr-6">
      <TabsPrimitive.Root
        value={activeTab}
        onValueChange={(v) => v && onTabChange(v as RunTab)}
        className="group/tabs flex h-full flex-col justify-end"
      >
        <TabsList variant="line" className="h-full border-b-0 px-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </TabsPrimitive.Root>

      <div className="flex items-center gap-2">
        {configSelector}
        <div className="h-4 w-px bg-border" />
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
