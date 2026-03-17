import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog/DeleteLimitDialog";
import { ModelLog, ModelStatusEnum } from "@repo/schema";
import { Button, Stack, Text } from "@repo/ui";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useDeleteModelMutation,
  useGetModelLogsQuery,
  useGetModelQuery,
  useTrainModelMutation,
} from "../../services";
import { ModelLayout } from "../ModelLayout";
import { ModelLogs } from "../ModelLogs";
import { TrainingChart } from "../TrainingChart";
import styles from "./ModelDetailPage.module.scss";

export interface ModelDetailPageProps {}

export const ModelDetailPage = ({}: ModelDetailPageProps) => {
  const navigate = useNavigate();
  const { projectId, modelId } = useParams();
  const [deleteModel, { isLoading: isDeleting }] = useDeleteModelMutation();
  const [trainModel] = useTrainModelMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const downloadLogs = useCallback((logs: ModelLog[]) => {
    const metricKeys = [...new Set(logs.flatMap((log) => Object.keys(log.metrics)))];
    const header = ["epoch", "timestamp", ...metricKeys].join(",");
    const rows = logs.map((log) =>
      [log.epoch, log.createdAt, ...metricKeys.map((key) => log.metrics[key] ?? "")].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-${modelId}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [modelId]);

  const { data: model, refetch: refetchModel } = useGetModelQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });
  const { data: logs, refetch: refetchLogs } = useGetModelLogsQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });

  const isTraining = model?.status === ModelStatusEnum.TRAINING;
  const isActive = isTraining || model?.status === ModelStatusEnum.CONVERTING;

  useEffect(() => {
    if (!isTraining) return;
    const logsInterval = setInterval(() => refetchLogs(), 1000);
    return () => clearInterval(logsInterval);
  }, [isTraining, refetchLogs]);

  useEffect(() => {
    if (!isActive) return;
    const modelInterval = setInterval(() => refetchModel(), 3000);
    return () => clearInterval(modelInterval);
  }, [isActive, refetchModel]);

  return (
    <ModelLayout className={styles.modelDetailPage}>
      <Stack direction="row" justify="space-between" align="center">
        <Text weight="700" className={styles.title} as="p" variant="text-20">
          {model?.name}
        </Text>
        <Stack direction="row" justify="end">
          {logs && logs.length > 0 && (
            <Button variant="outlined" onClick={() => downloadLogs(logs)}>
              Download Logs
            </Button>
          )}
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            Delete
          </Button>
          {model?.status === ModelStatusEnum.DRAFT && (
            <Button
              onClick={async () => {
                await trainModel({
                  projectId: Number(projectId),
                  modelId: Number(modelId),
                }).unwrap();
              }}
            >
              Train
            </Button>
          )}
        </Stack>
      </Stack>
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
      {showDeleteDialog && (
        <DeleteLimitDialog
          title="Delete this model version?"
          description="This action cannot be undone. All training data and outputs for this version will be permanently deleted."
          confirmLabel="Delete version"
          isLoading={isDeleting}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={async () => {
            await deleteModel({
              projectId: Number(projectId),
              modelId: Number(modelId),
            }).unwrap();
            navigate(`/projects/${projectId}/models/new`);
          }}
        />
      )}
    </ModelLayout>
  );
};
