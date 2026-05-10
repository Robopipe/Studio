import type { ModelLog, ProjectTypeEnum } from "@repo/schema";
import { getHeadlineLabel, headlineSeries } from "../../utils/headlineMetric";
import { ModelLogs } from "../ModelLogs";
import { ModelMetrics } from "../ModelMetrics";
import { TrainingChart } from "../TrainingChart";

export interface ModelOverviewProps {
  modelName: string | undefined;
  logs: ModelLog[] | undefined;
  trainingType: ProjectTypeEnum | undefined;
}

export const ModelOverview = ({
  modelName,
  logs,
  trainingType,
}: ModelOverviewProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-8">
      {modelName && <h2 className="text-xl font-bold">{modelName}</h2>}
      <div className="grid grid-cols-2 gap-4">
        <TrainingChart
          title={trainingType ? getHeadlineLabel(trainingType) : "Accuracy"}
          data={trainingType ? headlineSeries(logs, trainingType) : []}
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
};
