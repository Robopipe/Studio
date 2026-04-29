import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import type { Label, ModelLog } from "@repo/schema";
import { useEffect, useMemo, useState } from "react";
import { PerClassRow } from "./PerClassRow";
import { resolveLabelName, toTabLabel } from "./utils";

export interface PerClassCardProps {
  log: ModelLog;
  labelsById: Map<number, Label>;
  colorByLabelId: Map<number, string>;
}

export const PerClassCard = ({
  log,
  labelsById,
  colorByLabelId,
}: PerClassCardProps) => {
  const baseKeys = useMemo(() => {
    if (!log.perClassMetrics) return [];
    return Object.keys(log.perClassMetrics).sort();
  }, [log]);

  const [selectedBaseKey, setSelectedBaseKey] = useState<string>(
    baseKeys[0] ?? "",
  );

  useEffect(() => {
    if (!selectedBaseKey && baseKeys[0]) {
      setSelectedBaseKey(baseKeys[0]);
    } else if (selectedBaseKey && !baseKeys.includes(selectedBaseKey)) {
      setSelectedBaseKey(baseKeys[0] ?? "");
    }
  }, [baseKeys, selectedBaseKey]);

  const byLabelId = useMemo(
    () => log.perClassMetrics?.[selectedBaseKey] ?? {},
    [log, selectedBaseKey],
  );

  const rows = useMemo(
    () =>
      Object.keys(byLabelId)
        .map((id) => ({
          labelId: id,
          labelName: resolveLabelName(id, labelsById),
          value: byLabelId[id],
        }))
        .sort((a, b) => a.labelName.localeCompare(b.labelName)),
    [byLabelId, labelsById],
  );

  if (baseKeys.length === 0) return null;

  return (
    <Collapsible defaultOpen>
      <div className="rounded-lg border border-gray-200 bg-white">
        <CollapsibleTrigger className="p-5 text-foreground">
          <span className="text-xs font-bold uppercase tracking-wide">
            Per-class metrics
          </span>
        </CollapsibleTrigger>
        <CollapsiblePanel className="flex flex-col gap-4 px-5 pb-5">
          <p className="text-sm text-muted-foreground">
            Per-label accuracy/precision/recall reported by the training run on
            the final epoch.
          </p>

          <Tabs
            value={selectedBaseKey}
            onValueChange={(v) => v && setSelectedBaseKey(String(v))}
          >
            <TabsList variant="line" className="px-0">
              {baseKeys.map((key) => (
                <TabsTrigger key={key} value={key} title={key}>
                  {toTabLabel(key)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col">
            {rows.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No per-class data.
              </p>
            ) : (
              rows.map((row) => (
                <PerClassRow
                  key={row.labelId}
                  labelName={row.labelName}
                  value={row.value}
                  color={colorByLabelId.get(Number(row.labelId)) ?? "#10b981"}
                />
              ))
            )}
          </div>
        </CollapsiblePanel>
      </div>
    </Collapsible>
  );
};
