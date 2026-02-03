import { ModelStatusEnum } from "@repo/schema";
import { Button, Stack, Text } from "@repo/ui";
import { useEffect } from "react";
import { useParams } from "react-router";
import { useGetModelLogsQuery, useGetModelQuery } from "../../services";
import { ModelLayout } from "../ModelLayout";
import { ModelLogs } from "../ModelLogs";
import { TrainingChart } from "../TrainingChart";
import styles from "./ModelDetailPage.module.scss";

export interface ModelDetailPageProps {}

export const ModelDetailPage = ({}: ModelDetailPageProps) => {
  const { projectId, modelId } = useParams();
  const { data: model, refetch: refetchModel } = useGetModelQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });
  const { data: logs, refetch: refetchLogs } = useGetModelLogsQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });

  useEffect(() => {
    let logsInterval: NodeJS.Timeout | null = null;
    if (!logsInterval && model && model.status === "TRAINING") {
      logsInterval = setInterval(() => refetchLogs(), 1000);
    }

    let modelInterval: NodeJS.Timeout | null = null;
    if (
      !modelInterval &&
      model &&
      (model.status === "TRAINING" || model.status === "CONVERTING")
    ) {
      modelInterval = setInterval(() => refetchModel(), 1000);
    }

    return () => {
      if (logsInterval) {
        clearInterval(logsInterval);
      }
      if (modelInterval) {
        clearInterval(modelInterval);
      }
    };
  }, [model]);

  return (
    <ModelLayout className={styles.modelDetailPage}>
      <Text weight="700" className={styles.title} as="p" variant="text-20">
        {model?.name}
      </Text>
      <Stack direction="row">
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
      </Stack>
      <ModelLogs />
      <Stack direction="row" justify="end">
        <Button variant="danger">Delete</Button>
        {model?.status === ModelStatusEnum.DRAFT && <Button>Train</Button>}
      </Stack>
    </ModelLayout>
  );
};
