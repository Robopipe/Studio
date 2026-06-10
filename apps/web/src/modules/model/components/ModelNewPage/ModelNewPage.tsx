import {
  useGetTaskIdsQuery,
  useGetTasksQuery,
} from "@/modules/capture/services/captureApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ModelRegionEnum,
  // hyperparamsConfigSchema import kept for reference — validation intentionally bypassed
  // hyperparamsConfigSchema,
  Label as ProjectLabel,
  ProjectTypeEnum,
} from "@repo/schema";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  useCreateModelMutation,
  useDatasetStatsMutation,
  useGetModelsQuery,
} from "../../services";
import { AdvancedSettings } from "../AdvancedSettings";
import { getHyperparamsPresets } from "../AdvancedSettings/presets";
import { AppliedAugmentation } from "../AugmentationSettings/augmentationTypes";
import { DatasetSplit, DatasetSplitSettings } from "../DatasetSplitSettings";
import { ModelLayout } from "../ModelLayout/ModelLayout";
import { ModelTypeSettings } from "../ModelTypeSettings";
import {
  MAX_VISIBLE_THUMBNAILS,
  SourceImagesSettings,
} from "../SourceImagesSettings";
import { TaskSelectionDialog } from "../TaskSelectionDialog";

export interface DuplicateModelState {
  duplicateFrom: {
    epochs: number;
    trainingType: ProjectTypeEnum;
    annotationsUsed: ProjectTypeEnum[];
    labels: ProjectLabel[];
    outputs: ModelOutputTypeEnum[];
    backend: ModelBackendEnum;
    region: ModelRegionEnum;
    quantization: ModelQuantizationEnum;
    datasetSplit: DatasetSplit;
    augmentations: AppliedAugmentation[];
    preprocessings: AppliedAugmentation[];
    customHyperparams: string;
    taskIds?: number[];
    taskPreviews?: { id: number; thumbnailUrl: string }[];
    /** Source model's dataset version — lets the new model reuse the exact same version (no duplication) when taskIds are unchanged. */
    datasetVersionId?: number | null;
  };
}

export interface ModelNewPageProps {}

const ModelNewPageInner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateState = (location.state as DuplicateModelState | null)
    ?.duplicateFrom;

  const [activeProject] = useActiveProject();
  const [createModel] = useCreateModelMutation();
  const { data: existingModels } = useGetModelsQuery(
    { projectId: activeProject?.id! },
    { skip: !activeProject },
  );
  const [name, setName] = useState("");
  const [epochs, setEpochs] = useState<number | null>(
    duplicateState?.epochs ?? 100,
  );
  const [outputs, setOutputs] = useState<ModelOutputTypeEnum[]>(
    duplicateState?.outputs ?? [
      ModelOutputTypeEnum.RAW,
      ModelOutputTypeEnum.RVC4,
    ],
  );
  const [backend, setBackend] = useState<ModelBackendEnum>(
    duplicateState?.backend ?? ModelBackendEnum.ULTRALYTICS,
  );
  const [region, setRegion] = useState<ModelRegionEnum>(
    duplicateState?.region ?? ModelRegionEnum.EUROPE_WEST4,
  );
  const [quantization, setQuantization] = useState<ModelQuantizationEnum>(
    duplicateState?.quantization ?? ModelQuantizationEnum.FP16,
  );
  const [activeLabels, setActiveLabels] = useState<ProjectLabel[]>(
    duplicateState?.labels ?? [],
  );
  const [datasetSplit, setDatasetSplit] = useState<DatasetSplit>(
    duplicateState?.datasetSplit ?? { train: 70, validation: 20, test: 10 },
  );
  // Preprocessing + augmentation UI is hidden; values come from a duplicated
  // model's payload (when duplicating) or default to empty.
  const augmentations: AppliedAugmentation[] =
    duplicateState?.augmentations ?? [];
  const preprocessings: AppliedAugmentation[] =
    duplicateState?.preprocessings ?? [];
  const [trainingType, setTrainingType] = useState<ProjectTypeEnum>(
    duplicateState?.trainingType ?? ProjectTypeEnum.DETECTION,
  );
  const [annotationsUsed, setAnnotationsUsed] = useState<ProjectTypeEnum[]>(
    duplicateState?.annotationsUsed ?? [ProjectTypeEnum.DETECTION],
  );
  const [customHyperparams, setCustomHyperparams] = useState(() => {
    if (duplicateState?.customHyperparams !== undefined) {
      return duplicateState.customHyperparams;
    }
    // Default to the High Accuracy preset for the initial backend.
    const initialBackend =
      duplicateState?.backend ?? ModelBackendEnum.ULTRALYTICS;
    const preset = getHyperparamsPresets(initialBackend).find(
      (p) => p.id === "high-accuracy",
    );
    return preset ? JSON.stringify(preset.config, null, 2) : "";
  });
  const [hyperparamsError, setHyperparamsError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [epochsError, setEpochsError] = useState<string | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checkDataset] = useDatasetStatsMutation();
  const didPrefillName = useRef(false);

  // Task selection state — modal-controlled
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>(
    duplicateState?.taskIds ?? [],
  );
  const [selectedTaskPreviews, setSelectedTaskPreviews] = useState<
    { id: number; thumbnailUrl: string }[]
  >(duplicateState?.taskPreviews ?? []);
  // Source model's dataset version (only set when duplicating). The backend
  // reuses this version if taskIds are unchanged, or appends a new version
  // under the same dataset if they've been edited.
  const sourceDatasetVersionId = duplicateState?.datasetVersionId ?? undefined;

  // When duplicating, we receive taskIds but no thumbnail URLs. Fetch them
  // so the Source Images card can render the preview row.
  const needsPreviewFetch =
    selectedTaskIds.length > 0 && selectedTaskPreviews.length === 0;
  const previewIds = selectedTaskIds.slice(0, MAX_VISIBLE_THUMBNAILS);
  const { data: previewTasksData } = useGetTasksQuery(
    {
      projectId: activeProject?.id!,
      limit: previewIds.length || 1,
      ids: previewIds.join(","),
    },
    { skip: !activeProject?.id || !needsPreviewFetch },
  );

  useEffect(() => {
    if (!needsPreviewFetch || !previewTasksData) return;
    setSelectedTaskPreviews(
      previewTasksData.data.map((t) => ({
        id: t.id,
        thumbnailUrl: t.thumbnailUrl,
      })),
    );
  }, [needsPreviewFetch, previewTasksData]);

  // First-load default: behave as if the user opened the dialog and clicked
  // "select all". Pre-populate the explicit task list + a thumbnail row so the
  // Source Images card renders previews + overflow instead of "All images".
  // Skipped when duplicating (taskIds already provided) or after any user
  // interaction with the dialog.
  const userPickedTasks = useRef(Boolean(duplicateState));
  const shouldPrefillTasks =
    !userPickedTasks.current && selectedTaskIds.length === 0;
  const { data: defaultTaskIdsData } = useGetTaskIdsQuery(
    {
      projectId: activeProject?.id!,
      annotated: "true",
      sortOrder: "desc",
    },
    { skip: !activeProject?.id || !shouldPrefillTasks },
  );
  const { data: defaultTasksData } = useGetTasksQuery(
    {
      projectId: activeProject?.id!,
      page: 1,
      limit: 15,
      annotated: "true",
      sortOrder: "desc",
    },
    { skip: !activeProject?.id || !shouldPrefillTasks },
  );

  useEffect(() => {
    if (userPickedTasks.current) return;
    if (!defaultTaskIdsData || !defaultTasksData) return;
    userPickedTasks.current = true;
    setSelectedTaskIds(defaultTaskIdsData.ids);
    setSelectedTaskPreviews(
      defaultTasksData.data.map((t) => ({
        id: t.id,
        thumbnailUrl: t.thumbnailUrl,
      })),
    );
  }, [defaultTaskIdsData, defaultTasksData]);

  // Clear location state after reading to prevent re-prefill on refresh
  useEffect(() => {
    if (location.state?.duplicateFrom) {
      window.history.replaceState({}, "");
    }
  }, []);

  useEffect(() => {
    if (didPrefillName.current || !existingModels) return;
    didPrefillName.current = true;
    const next = existingModels.length + 1;
    setName(`Model V${String(next).padStart(2, "0")}`);
  }, [existingModels]);

  // Debounced dataset validation — fires whenever the user changes task selection
  // or training type. Disables Save/Train if no annotated images match the type.
  useEffect(() => {
    if (!activeProject?.id) return;
    const timer = setTimeout(() => {
      checkDataset({
        projectId: activeProject.id,
        taskIds: selectedTaskIds,
        trainingType,
        annotationsUsed,
      })
        .unwrap()
        .then((result) => {
          if (!result.valid) {
            const msg =
              result.totalCandidateCount === 0
                ? "No annotated images in this dataset. Label at least one image before saving."
                : `${result.labeledCount} of ${result.totalCandidateCount} selected images have ${trainingType.toLowerCase()} annotations. At least one is required.`;
            setDatasetError(msg);
          } else {
            setDatasetError(null);
          }
        })
        .catch(() => setDatasetError(null));
    }, 300);
    return () => clearTimeout(timer);
    // checkDataset is a stable mutation trigger — omitted from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskIds, trainingType, annotationsUsed, activeProject?.id]);

  // When switching backend, swap the hyperparams JSON to the new backend's
  // matching preset *iff* the current text still matches a preset of the
  // previous backend. That way users on defaults get the right defaults for
  // the new backend (fast/high/low align by id), but anyone who hand-edited
  // the JSON keeps their work — backend change isn't a license to wipe it.
  const handleBackendChange = (next: ModelBackendEnum) => {
    if (next === backend) return;
    const previousPresets = getHyperparamsPresets(backend);
    const matched = previousPresets.find(
      (p) => JSON.stringify(p.config, null, 2) === customHyperparams,
    );
    if (matched) {
      const newPresets = getHyperparamsPresets(next);
      const swap =
        newPresets.find((p) => p.id === matched.id) ??
        newPresets.find((p) => p.id === "high-accuracy");
      if (swap) {
        setCustomHyperparams(JSON.stringify(swap.config, null, 2));
        setHyperparamsError(null);
      }
    }
    setBackend(next);
  };

  const parseHyperparams = (): Record<string, unknown> | undefined => {
    if (!customHyperparams.trim()) return {};
    try {
      const parsed = JSON.parse(customHyperparams);
      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      ) {
        setHyperparamsError("Must be a JSON object");
        return undefined;
      }
      setHyperparamsError(null);
      return parsed;
    } catch {
      setHyperparamsError("Invalid JSON");
      return undefined;
    }
  };

  const saveModel = async (train = false) => {
    if (datasetError) return;
    setSaveError(null);
    const trimmedName = name.trim();
    const nextNameError = trimmedName ? null : "Version name is required";
    const nextEpochsError =
      epochs !== null && epochs > 0 ? null : "Epochs must be greater than 0";
    setNameError(nextNameError);
    setEpochsError(nextEpochsError);
    if (nextNameError || nextEpochsError) return;

    const parsedHyperparams = parseHyperparams();
    if (parsedHyperparams === undefined) return;

    const normalAugs = augmentations.filter((a) => !a.duplicateImage);
    const duplicateAugs = augmentations.filter((a) => a.duplicateImage);

    const allPreprocessings = [
      ...preprocessings.map((p) => ({
        type: p.type,
        params: p.params,
        keepOriginal: false,
      })),
      ...duplicateAugs.map((a) => {
        const { p: _p, ...paramsWithoutP } = a.params;
        return {
          type: a.type,
          params: paramsWithoutP,
          keepOriginal: true,
        };
      }),
    ];

    try {
      const newModel = await createModel({
        epochs: epochs!,
        labelIds: activeLabels?.map((label) => label.id) || [],
        taskIds: selectedTaskIds,
        ...(sourceDatasetVersionId != null && { sourceDatasetVersionId }),
        name,
        projectId: activeProject?.id!,
        splitTest: datasetSplit.test,
        splitTrain: datasetSplit.train,
        splitValidate: datasetSplit.validation,
        outputTypes: outputs,
        backend,
        region,
        quantization,
        trainingType,
        annotationsUsed,
        augmentations: normalAugs.map((a) => ({
          type: a.type,
          params: a.params,
        })),
        preprocessings: allPreprocessings,
        customHyperparams: parsedHyperparams,
        train,
      }).unwrap();
      navigate(`/projects/${activeProject?.id}/models/${newModel.id}`);
    } catch (err: unknown) {
      const msg =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { message?: unknown } }).data?.message ===
          "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to save model. Please try again.";
      setSaveError(msg);
    }
  };

  return (
    <ModelLayout>
      <div className="flex flex-col gap-6 pb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-bold leading-6 text-black/90">
            Create new version
          </h2>
          <p className="text-sm leading-5 text-black/60">
            Prepare your images and data for training by compiling them into a
            dataset. Experiment with different configurations to achieve better
            training results
          </p>
        </div>
        <div className="flex flex-row items-start gap-2">
          <Label
            htmlFor="versionName"
            className="h-9 w-[152px] shrink-0 items-center text-xs font-normal text-black/60"
          >
            Version name
          </Label>
          <div className="flex flex-1 flex-col gap-1">
            <Input
              id="versionName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              aria-invalid={Boolean(nameError) || undefined}
            />
            {nameError && (
              <span className="text-xs text-red-600">{nameError}</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <NumberInput
              min={1}
              value={epochs}
              onValueChange={(v) => {
                setEpochs(v);
                if (epochsError) setEpochsError(null);
              }}
              placeholder="Epochs"
              error={Boolean(epochsError)}
            />
            {epochsError && (
              <span className="text-xs text-red-600">{epochsError}</span>
            )}
          </div>
        </div>
        <ModelTypeSettings
          trainingType={trainingType}
          annotationsUsed={annotationsUsed}
          onTrainingTypeChange={setTrainingType}
          onAnnotationsUsedChange={setAnnotationsUsed}
        />
        <SourceImagesSettings
          setActiveLabels={setActiveLabels}
          activeLabels={activeLabels}
          selectedTaskIds={selectedTaskIds}
          selectedTaskPreviews={selectedTaskPreviews}
          onEditSelection={() => setSelectionDialogOpen(true)}
          datasetError={datasetError}
        />
        <DatasetSplitSettings
          split={datasetSplit}
          onChange={setDatasetSplit}
          customTotal={
            selectedTaskIds.length > 0 ? selectedTaskIds.length : undefined
          }
        />
        <AdvancedSettings
          outputs={outputs}
          onOutputsChange={setOutputs}
          backend={backend}
          onBackendChange={handleBackendChange}
          region={region}
          onRegionChange={setRegion}
          quantization={quantization}
          onQuantizationChange={setQuantization}
          customHyperparams={customHyperparams}
          onCustomHyperparamsChange={setCustomHyperparams}
          hyperparamsError={hyperparamsError}
          onHyperparamsErrorChange={setHyperparamsError}
        />

        {saveError && <span className="text-xs text-red-600">{saveError}</span>}
        <div className="flex flex-row justify-end gap-2">
          <Button onClick={() => saveModel()} disabled={Boolean(datasetError)}>
            Save
          </Button>
          <Button
            onClick={() => saveModel(true)}
            disabled={Boolean(datasetError)}
          >
            Save &amp; Train
          </Button>
        </div>
      </div>

      <TaskSelectionDialog
        open={selectionDialogOpen}
        onOpenChange={setSelectionDialogOpen}
        initialSelectedIds={selectedTaskIds}
        onSave={({ taskIds, previews }) => {
          userPickedTasks.current = true;
          setSelectedTaskIds(taskIds);
          setSelectedTaskPreviews(previews);
        }}
      />
    </ModelLayout>
  );
};

export const ModelNewPage = () => {
  const location = useLocation();
  return <ModelNewPageInner key={location.key} />;
};
