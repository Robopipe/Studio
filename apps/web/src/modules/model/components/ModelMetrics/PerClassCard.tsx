import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import type { Label, ModelLog } from "@repo/schema";
import { useEffect, useMemo, useState } from "react";
import { EpochSlider } from "./EpochSlider";
import { PerClassRow } from "./PerClassRow";
import { useEpochSlider } from "./useEpochSlider";
import { resolveLabelName, toTabLabel } from "./utils";

export interface PerClassCardProps {
  logsWithPerClass: ModelLog[];
  labelsById: Map<number, Label>;
  colorByLabelId: Map<number, string>;
}

export const PerClassCard = ({
  logsWithPerClass,
  labelsById,
  colorByLabelId,
}: PerClassCardProps) => {
  const baseKeys = useMemo(() => {
    const set = new Set<string>();
    for (const log of logsWithPerClass) {
      if (!log.perClassMetrics) continue;
      for (const k of Object.keys(log.perClassMetrics)) set.add(k);
    }
    return Array.from(set).sort();
  }, [logsWithPerClass]);

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

  const { safeIndex, selectedLog, selectedEpoch, lastEpoch, max, handleChange } =
    useEpochSlider(logsWithPerClass);

  const byLabelId = useMemo(
    () => selectedLog?.perClassMetrics?.[selectedBaseKey] ?? {},
    [selectedLog, selectedBaseKey],
  );

  const rows = useMemo(() => {
    // Row set is the union of labels that have ever appeared in this base key,
    // so the table doesn't jitter as the user scrubs across epochs.
    const labelIds = new Set<string>();
    for (const log of logsWithPerClass) {
      const bucket = log.perClassMetrics?.[selectedBaseKey];
      if (!bucket) continue;
      for (const id of Object.keys(bucket)) labelIds.add(id);
    }
    return Array.from(labelIds)
      .map((id) => ({
        labelId: id,
        labelName: resolveLabelName(id, labelsById),
        value: byLabelId[id],
      }))
      .sort((a, b) => a.labelName.localeCompare(b.labelName));
  }, [logsWithPerClass, selectedBaseKey, byLabelId, labelsById]);

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
            Per-label accuracy/precision/recall reported by the training run,
            per epoch. Slide to inspect earlier epochs.
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

          {logsWithPerClass.length > 1 && (
            <EpochSlider
              index={safeIndex}
              max={max}
              currentEpoch={selectedEpoch}
              lastEpoch={lastEpoch}
              onChange={handleChange}
            />
          )}

          <div className="flex flex-col">
            {rows.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No per-class data for this epoch.
              </p>
            ) : (
              rows.map((row) => (
                <PerClassRow
                  key={row.labelId}
                  labelName={row.labelName}
                  value={row.value}
                  color={
                    colorByLabelId.get(Number(row.labelId)) ?? "#10b981"
                  }
                />
              ))
            )}
          </div>
        </CollapsiblePanel>
      </div>
    </Collapsible>
  );
};
