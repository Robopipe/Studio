import { type Label, ModelStatusEnum } from "@repo/schema";
import { useMemo } from "react";
import { useModelParams } from "../../hooks/useModelParams";
import { useGetModelLogsQuery, useGetModelQuery } from "../../services";
import { ConfusionMatrixCard } from "./ConfusionMatrixCard";
import { PerClassCard } from "./PerClassCard";
import { FALLBACK_COLORS } from "./utils";

export interface ModelMetricsProps {}

export const ModelMetrics = ({}: ModelMetricsProps) => {
  const { projectId, modelId } = useModelParams();
  const { data: model } = useGetModelQuery({ projectId, modelId });
  const { data: logs } = useGetModelLogsQuery({ projectId, modelId });

  const labelsById = useMemo(() => {
    const map = new Map<number, Label>();
    for (const label of model?.labels ?? []) map.set(label.id, label);
    return map;
  }, [model?.labels]);

  const colorByLabelId = useMemo(() => {
    const map = new Map<number, string>();
    (model?.labels ?? []).forEach((label, idx) => {
      map.set(
        label.id,
        label.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
      );
    });
    return map;
  }, [model?.labels]);

  const lastLogWithPerClass = useMemo(() => {
    const filtered = (logs ?? []).filter(
      (l) => l.perClassMetrics && Object.keys(l.perClassMetrics).length > 0,
    );
    return filtered[filtered.length - 1];
  }, [logs]);

  const lastLogWithCm = useMemo(() => {
    const filtered = (logs ?? []).filter(
      (l) => l.confusionMatrix && Object.keys(l.confusionMatrix).length > 0,
    );
    return filtered[filtered.length - 1];
  }, [logs]);

  // Per-class + confusion matrix are only meaningful at end-of-run, so we hide
  // them while training is still in progress and surface only the final epoch.
  const isTerminal =
    model?.status === ModelStatusEnum.DONE ||
    model?.status === ModelStatusEnum.CONVERTING ||
    model?.status === ModelStatusEnum.ERROR ||
    model?.status === ModelStatusEnum.CANCELLED;

  if (!isTerminal) return null;
  if (!lastLogWithPerClass && !lastLogWithCm) return null;

  return (
    <div className="flex flex-col gap-4">
      {lastLogWithPerClass && (
        <PerClassCard
          log={lastLogWithPerClass}
          labelsById={labelsById}
          colorByLabelId={colorByLabelId}
        />
      )}
      {lastLogWithCm && (
        <ConfusionMatrixCard log={lastLogWithCm} labelsById={labelsById} />
      )}
    </div>
  );
};
