import { ProjectTypeEnum, type ModelLog } from "@repo/schema";
import {
  headlineDualSeries,
  headlineSeriesConfig,
} from "../../utils/headlineMetric";
import { ModelLogs } from "../ModelLogs";
import { ModelMetrics } from "../ModelMetrics";
import { TrainingChart } from "../TrainingChart";

const LOSS_SERIES = [{ key: "value", label: "Loss" }];

const headlineTitle = (trainingType: ProjectTypeEnum | undefined): string => {
  if (
    trainingType === ProjectTypeEnum.DETECTION ||
    trainingType === ProjectTypeEnum.SEGMENTATION
  ) {
    return "Model Performance";
  }
  return "Accuracy";
};

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
          title={headlineTitle(trainingType)}
          data={trainingType ? headlineDualSeries(logs, trainingType) : []}
          series={trainingType ? headlineSeriesConfig(trainingType) : []}
        />
        <TrainingChart
          title="Loss"
          series={LOSS_SERIES}
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
