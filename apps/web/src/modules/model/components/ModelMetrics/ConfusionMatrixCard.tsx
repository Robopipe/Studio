import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import type { Label, ModelLog } from "@repo/schema";
import { useEffect, useMemo, useState } from "react";
import { ConfusionMatrixTable } from "./ConfusionMatrixTable";
import { EpochSlider } from "./EpochSlider";
import { useEpochSlider } from "./useEpochSlider";
import { toTabLabel } from "./utils";

export interface ConfusionMatrixCardProps {
  logsWithCm: ModelLog[];
  labelsById: Map<number, Label>;
}

export const ConfusionMatrixCard = ({
  logsWithCm,
  labelsById,
}: ConfusionMatrixCardProps) => {
  const matrixKeys = useMemo(() => {
    const set = new Set<string>();
    for (const log of logsWithCm) {
      if (!log.confusionMatrix) continue;
      for (const k of Object.keys(log.confusionMatrix)) set.add(k);
    }
    return Array.from(set).sort();
  }, [logsWithCm]);

  const [selectedKey, setSelectedKey] = useState<string>(matrixKeys[0] ?? "");

  useEffect(() => {
    if (!selectedKey && matrixKeys[0]) {
      setSelectedKey(matrixKeys[0]);
    } else if (selectedKey && !matrixKeys.includes(selectedKey)) {
      setSelectedKey(matrixKeys[0] ?? "");
    }
  }, [matrixKeys, selectedKey]);

  const { safeIndex, selectedLog, selectedEpoch, lastEpoch, max, handleChange } =
    useEpochSlider(logsWithCm);

  const entry = selectedLog?.confusionMatrix?.[selectedKey];

  if (matrixKeys.length === 0) return null;

  return (
    <Collapsible defaultOpen>
      <div className="rounded-lg border border-gray-200 bg-white">
        <CollapsibleTrigger className="p-5 text-foreground">
          <span className="text-xs font-bold uppercase tracking-wide">
            Confusion matrix
          </span>
        </CollapsibleTrigger>
        <CollapsiblePanel className="flex flex-col gap-4 px-5 pb-5">
          <p className="text-sm text-muted-foreground">
            Rows are ground-truth labels; columns are predictions. Diagonal
            cells (correct predictions) are green, off-diagonal cells
            (confusions) are red. Intensity scales with the largest cell in the
            matrix.
          </p>

          {matrixKeys.length > 1 && (
            <Tabs
              value={selectedKey}
              onValueChange={(v) => v && setSelectedKey(String(v))}
            >
              <TabsList variant="line" className="px-0">
                {matrixKeys.map((key) => (
                  <TabsTrigger key={key} value={key} title={key}>
                    {toTabLabel(key)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {logsWithCm.length > 1 && (
            <EpochSlider
              index={safeIndex}
              max={max}
              currentEpoch={selectedEpoch}
              lastEpoch={lastEpoch}
              onChange={handleChange}
            />
          )}

          {entry ? (
            <ConfusionMatrixTable
              matrixKey={selectedKey}
              labels={entry.labels}
              matrix={entry.matrix}
              labelsById={labelsById}
            />
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No confusion-matrix data for this epoch.
            </p>
          )}
        </CollapsiblePanel>
      </div>
    </Collapsible>
  );
};
