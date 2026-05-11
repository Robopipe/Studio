import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import type { Label, ModelLog } from "@repo/schema";
import { useEffect, useMemo, useState } from "react";
import { ConfusionMatrixTable } from "./ConfusionMatrixTable";
import { toTabLabel } from "./utils";

export interface ConfusionMatrixCardProps {
  log: ModelLog;
  labelsById: Map<number, Label>;
}

export const ConfusionMatrixCard = ({
  log,
  labelsById,
}: ConfusionMatrixCardProps) => {
  const matrixKeys = useMemo(() => {
    if (!log.confusionMatrix) return [];
    return Object.keys(log.confusionMatrix).sort();
  }, [log]);

  const [selectedKey, setSelectedKey] = useState<string>(matrixKeys[0] ?? "");

  useEffect(() => {
    if (!selectedKey && matrixKeys[0]) {
      setSelectedKey(matrixKeys[0]);
    } else if (selectedKey && !matrixKeys.includes(selectedKey)) {
      setSelectedKey(matrixKeys[0] ?? "");
    }
  }, [matrixKeys, selectedKey]);

  const entry = log.confusionMatrix?.[selectedKey];

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
            cells (correct predictions) are green; off-diagonal cells
            (confusions) are red, and intensity scales with the largest cell in
            the matrix. A strong green diagonal means the model is performing
            well. Scan a row to see which classes a true label gets mistaken
            for, and a column to see which true classes a prediction pulls in —
            bright red cells highlight the pairs the model struggles to tell
            apart.
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

          {entry ? (
            <ConfusionMatrixTable
              matrixKey={selectedKey}
              labels={entry.labels}
              matrix={entry.matrix}
              labelsById={labelsById}
            />
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No confusion-matrix data.
            </p>
          )}
        </CollapsiblePanel>
      </div>
    </Collapsible>
  );
};
