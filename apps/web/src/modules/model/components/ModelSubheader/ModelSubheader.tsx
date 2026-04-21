import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import type { ReactNode } from "react";

export type ModelTab = "overview" | "parameters";

export interface ModelSubheaderProps {
  activeTab: ModelTab;
  onTabChange: (tab: ModelTab) => void;
  actions?: ReactNode;
}

const TABS: { key: ModelTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "parameters", label: "Parameters" },
];

export const ModelSubheader = ({
  activeTab,
  onTabChange,
  actions,
}: ModelSubheaderProps) => (
  <div className="flex h-12 shrink-0 items-end justify-between border-b border-black/10 bg-black/3 pr-6">
    <Tabs
      value={activeTab}
      onValueChange={(v) => v && onTabChange(v as ModelTab)}
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

    {actions && (
      <div className="flex h-full items-center gap-2">{actions}</div>
    )}
  </div>
);
