import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog/DeleteLimitDialog";
import { Button } from "@/modules/shadcn/ui/button";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { ModelStatusEnum } from "@repo/schema";
import { Copy, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { AppliedAugmentation } from "../AugmentationSettings/augmentationTypes";
import type { DuplicateModelState } from "../ModelNewPage/ModelNewPage";
import {
  useDeleteModelMutation,
  useGetModelLogsQuery,
  useGetModelQuery,
  useTrainModelMutation,
} from "../../services";
import { ModelLayout } from "../ModelLayout";
import { ModelOverview } from "../ModelOverview";
import { ModelParameters } from "../ModelParameters";
import { ModelSubheader, type ModelTab } from "../ModelSubheader";
import { TrainingStartupScreen } from "../TrainingStartupScreen";

export interface ModelDetailPageProps {}

export const ModelDetailPage = ({}: ModelDetailPageProps) => {
  const navigate = useNavigate();
  const { projectId, modelId } = useParams();
  const [deleteModel, { isLoading: isDeleting }] = useDeleteModelMutation();
  const [trainModel] = useTrainModelMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<ModelTab>("overview");

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

  const handleDuplicate = () => {
    if (!model) return;

    // Convert preprocessings with keepOriginal back to duplicate-image augmentations
    const preprocessingsAsAugs: AppliedAugmentation[] = (model.preprocessings ?? [])
      .filter((p) => !p.keepOriginal)
      .map((p) => ({
        id: crypto.randomUUID(),
        type: p.type,
        params: p.params as Record<string, number | boolean | string>,
      }));

    const duplicateAugs: AppliedAugmentation[] = (model.preprocessings ?? [])
      .filter((p) => p.keepOriginal)
      .map((p) => ({
        id: crypto.randomUUID(),
        type: p.type,
        params: { ...p.params, p: 1 } as Record<string, number | boolean | string>,
        duplicateImage: true,
      }));

    const normalAugs: AppliedAugmentation[] = (model.augmentations ?? []).map((a) => ({
      id: crypto.randomUUID(),
      type: a.type,
      params: a.params as Record<string, number | boolean | string>,
    }));

    const state: DuplicateModelState = {
      duplicateFrom: {
        name: `${model.name} (copy)`,
        epochs: model.epochs,
        trainingType: model.trainingType,
        annotationsUsed: model.annotationsUsed,
        labels: model.labels,
        outputs: model.outputTypes,
        datasetSplit: {
          train: model.splitTrain,
          validation: model.splitValidate,
          test: model.splitTest,
        },
        augmentations: [...normalAugs, ...duplicateAugs],
        preprocessings: preprocessingsAsAugs,
        customHyperparams:
          model.customHyperparams && Object.keys(model.customHyperparams).length > 0
            ? JSON.stringify(model.customHyperparams, null, 2)
            : "",
        taskIds: model.taskIds ?? [],
        datasetVersionId: model.datasetVersionId ?? null,
      },
    };

    navigate(`/projects/${projectId}/models/new`, { state });
  };

  if (isInitialLoading) {
    return (
      <ModelLayout>
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-[40%]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-62.5 w-1/2 rounded-lg" />
            <Skeleton className="h-62.5 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="min-h-0 flex-1 rounded-2xl" />
        </div>
      </ModelLayout>
    );
  }

  if (isWaitingForLogs) {
    return (
      <ModelLayout>
        <TrainingStartupScreen modelName={model?.name} />
      </ModelLayout>
    );
  }

  const subheaderActions = (
    <>
      {model && (
        <Button variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="mr-1 size-4" />
          Duplicate
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
    </>
  );

  return (
    <ModelLayout>
      {/* Negate ModelLayout's p-6 on the top edge so the subheader is edge-to-edge. */}
      <div className="-mx-6 -mt-6 mb-4">
        <ModelSubheader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={subheaderActions}
        />
      </div>

      {/*
        `flex-1 min-h-0` forms the bounded-height chain so ModelLogs can use
        its own internal scroll. The bottom-gap at scroll-end is provided by
        a margin-bottom on ModelLogs itself (see ModelLogs.tsx) — margins
        extend the column's scrollHeight, so the gap appears after the
        overflowing content instead of being pinned inside the fixed-height
        wrapper.
      */}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === "overview" && (
          <ModelOverview modelName={model?.name} logs={logs} />
        )}
        {activeTab === "parameters" && model && (
          <ModelParameters model={model} />
        )}
      </div>

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
