import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog/DeleteLimitDialog";
import { ModelStatusEnum } from "@repo/schema";
import { Button, DeleteIcon, Stack, Text } from "@repo/ui";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useDeleteModelMutation,
  useGetModelLogsQuery,
  useGetModelQuery,
  useTrainModelMutation,
} from "../../services";
import { ModelLayout } from "../ModelLayout";
import { ModelLogs } from "../ModelLogs";
import { ModelParametersDialog } from "../ModelParametersDialog";
import { TrainingChart } from "../TrainingChart";
import styles from "./ModelDetailPage.module.scss";

export interface ModelDetailPageProps {}

export const ModelDetailPage = ({}: ModelDetailPageProps) => {
  const navigate = useNavigate();
  const { projectId, modelId } = useParams();
  const [deleteModel, { isLoading: isDeleting }] = useDeleteModelMutation();
  const [trainModel] = useTrainModelMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showParamsDialog, setShowParamsDialog] = useState(false);

  const {
    data: model,
    refetch: refetchModel,
    isLoading: isModelLoading,
  } = useGetModelQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });
  const {
    data: logs,
    refetch: refetchLogs,
    isLoading: isLogsLoading,
  } = useGetModelLogsQuery({
    projectId: Number(projectId),
    modelId: Number(modelId),
  });

  const isTraining = model?.status === ModelStatusEnum.TRAINING;
  const isActive = isTraining || model?.status === ModelStatusEnum.CONVERTING;
  const isInitialLoading = isModelLoading || isLogsLoading;
  const isWaitingForLogs = isTraining && (!logs || logs.length === 0);
  const showSkeleton = isInitialLoading || isWaitingForLogs;

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

  if (showSkeleton) {
    return (
      <ModelLayout className={styles.modelDetailPage}>
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-[40%]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>

          {/* Charts */}
          <div className="flex gap-4">
            <Skeleton className="h-62.5 w-1/2 rounded-lg" />
            <Skeleton className="h-62.5 w-1/2 rounded-lg" />
          </div>

          {/* Logs area */}
          <div
            className="flex-1 min-h-0 rounded-2xl flex flex-col items-center justify-center gap-3 p-6"
            style={{ backgroundColor: "#0f0f18" }}
          >
            {isWaitingForLogs && (
              <Text color="text-white-secondary" variant="text-14">
                Training is starting up...
              </Text>
            )}
            <div className="w-full flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-4 rounded"
                  style={{ width: `${85 - i * 10}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </ModelLayout>
    );
  }

  return (
    <ModelLayout className={styles.modelDetailPage}>
      <Stack direction="row" justify="space-between" align="center">
        <Text weight="700" className={styles.title} as="p" variant="text-20">
          {model?.name}
        </Text>
        <Stack direction="row" justify="end">
          {model && (
            <Button variant="outlined" size="sm" onClick={() => setShowParamsDialog(true)}>
              Show parameters
            </Button>
          )}
          {model?.status === ModelStatusEnum.DRAFT && (
            <Button
              size="sm"
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
          <Button
            variant="danger"
            size="sm"
            className={styles.deleteButton}
            onClick={() => setShowDeleteDialog(true)}
          >
            <DeleteIcon width={16} height={16} />
          </Button>
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
      {model && (
        <ModelParametersDialog
          model={model}
          open={showParamsDialog}
          onClose={() => setShowParamsDialog(false)}
        />
      )}
    </ModelLayout>
  );
};
