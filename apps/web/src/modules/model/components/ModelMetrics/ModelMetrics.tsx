import type { Label } from "@repo/schema";
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

  const logsWithPerClass = useMemo(
    () =>
      (logs ?? []).filter(
        (l) => l.perClassMetrics && Object.keys(l.perClassMetrics).length > 0,
      ),
    [logs],
  );

  const logsWithCm = useMemo(
    () =>
      (logs ?? []).filter(
        (l) => l.confusionMatrix && Object.keys(l.confusionMatrix).length > 0,
      ),
    [logs],
  );

  const hasPerClass = logsWithPerClass.length > 0;
  const hasCm = logsWithCm.length > 0;

  if (!hasPerClass && !hasCm) return null;

  return (
    <div className="flex flex-col gap-4">
      {hasPerClass && (
        <PerClassCard
          logsWithPerClass={logsWithPerClass}
          labelsById={labelsById}
          colorByLabelId={colorByLabelId}
        />
      )}
      {hasCm && (
        <ConfusionMatrixCard
          logsWithCm={logsWithCm}
          labelsById={labelsById}
        />
      )}
    </div>
  );
};
