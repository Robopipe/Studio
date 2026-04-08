import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog/DeleteLimitDialog";
import { Button } from "@/modules/shadcn/ui/button";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { ModelStatusEnum } from "@repo/schema";
import { Trash2 } from "lucide-react";
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
      <ModelLayout>
        <div className="flex min-h-0 flex-1 flex-col gap-6">
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
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl p-6"
            style={{ backgroundColor: "#0f0f18" }}
          >
            {isWaitingForLogs && (
              <span className="text-sm text-white/60">
                Training is starting up...
              </span>
            )}
            <div className="flex w-full flex-col gap-2">
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
    <ModelLayout>
      <div className="flex flex-row items-center justify-between">
        <p className="mb-8 text-xl font-bold">{model?.name}</p>
        <div className="flex flex-row justify-end gap-2">
          {model && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParamsDialog(true)}
            >
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
            variant="destructive"
            size="sm"
            className="p-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
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
