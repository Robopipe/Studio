import type { ModelLog } from "@repo/schema";
import { ModelLogs } from "../ModelLogs";
import { ModelMetrics } from "../ModelMetrics";
import { TrainingChart } from "../TrainingChart";

export interface ModelOverviewProps {
  logs: ModelLog[] | undefined;
}

export const ModelOverview = ({ logs }: ModelOverviewProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-row gap-4">
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
    </div>
    <ModelMetrics />
    <ModelLogs />
  </div>
);
