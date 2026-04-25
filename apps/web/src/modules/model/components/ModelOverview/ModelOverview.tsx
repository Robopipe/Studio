import type { ModelLog } from "@repo/schema";
import { ModelLogs } from "../ModelLogs";
import { ModelMetrics } from "../ModelMetrics";
import { TrainingChart } from "../TrainingChart";

export interface ModelOverviewProps {
  modelName: string | undefined;
  logs: ModelLog[] | undefined;
}

// Extra aggregate metrics emitted by the Ultralytics backend on top of the
// canonical accuracy/loss pair. Both `(B)` (box) and `(M)` (mask) keys are
// listed so segmentation runs surface the same series. The luxonis backend
// uses different keys, so absent metrics make their chart hide entirely.
const EXTRA_METRICS: { title: string; keys: string[] }[] = [
  { title: "mAP50", keys: ["metrics/mAP50(B)", "metrics/mAP50(M)"] },
  { title: "Precision", keys: ["metrics/precision(B)", "metrics/precision(M)"] },
  { title: "Recall", keys: ["metrics/recall(B)", "metrics/recall(M)"] },
];

const seriesFromKeys = (
  logs: ModelLog[] | undefined,
  keys: string[],
): { epoch: number; value: number }[] => {
  if (!logs?.length) return [];
  const series: { epoch: number; value: number }[] = [];
  for (const log of logs) {
    const metrics = log.metrics as Record<string, unknown>;
    for (const key of keys) {
      const raw = metrics[key];
      if (typeof raw === "number" && Number.isFinite(raw)) {
        series.push({ epoch: log.epoch, value: raw });
        break;
      }
    }
  }
  return series;
};

export const ModelOverview = ({ modelName, logs }: ModelOverviewProps) => {
  const extraSeries = EXTRA_METRICS.map((m) => ({
    title: m.title,
    data: seriesFromKeys(logs, m.keys),
  })).filter((m) => m.data.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {modelName && <h2 className="text-xl font-bold">{modelName}</h2>}
      <div className="grid grid-cols-2 gap-4">
        <TrainingChart
          title="Accuracy"
          data={
            logs?.map((log) => ({
              value: log.metrics.accuracy,
              epoch: log.epoch,
            })) ?? []
          }
        />
        <TrainingChart
          title="Loss"
          data={
            logs?.map((log) => ({
              value: log.metrics.loss,
              epoch: log.epoch,
            })) ?? []
          }
        />
        {extraSeries.map((m) => (
          <TrainingChart key={m.title} title={m.title} data={m.data} />
        ))}
      </div>
      <ModelMetrics />
      <ModelLogs />
    </div>
  );
};
