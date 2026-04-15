import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  // hyperparamsConfigSchema import kept for reference — validation intentionally bypassed
  // hyperparamsConfigSchema,
  Label as ProjectLabel,
  ModelOutputTypeEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useCreateModelMutation, useGetModelsQuery } from "../../services";
import { AdvancedSettings } from "../AdvancedSettings";
import { AppliedAugmentation } from "../AugmentationSettings/augmentationTypes";
import {
  DatasetSplit,
  DatasetSplitSettings,
} from "../DatasetSplitSettings";
import { ModelLayout } from "../ModelLayout/ModelLayout";
import { ModelTypeSettings } from "../ModelTypeSettings";
import { SourceImagesSettings } from "../SourceImagesSettings";

export interface DuplicateModelState {
  duplicateFrom: {
    name: string;
    epochs: number;
    trainingType: ProjectTypeEnum;
    annotationsUsed: ProjectTypeEnum[];
    labels: ProjectLabel[];
    outputs: ModelOutputTypeEnum[];
    datasetSplit: DatasetSplit;
    augmentations: AppliedAugmentation[];
    preprocessings: AppliedAugmentation[];
    customHyperparams: string;
  };
}

export interface ModelNewPageProps {}

export const ModelNewPage = ({}: ModelNewPageProps) => {
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
  const [name, setName] = useState(duplicateState?.name ?? "");
  const [epochs, setEpochs] = useState(duplicateState?.epochs ?? 100);
  const [outputs, setOutputs] = useState<ModelOutputTypeEnum[]>(
    duplicateState?.outputs ?? [ModelOutputTypeEnum.RAW, ModelOutputTypeEnum.RVC4],
  );
  const [activeLabels, setActiveLabels] = useState<ProjectLabel[]>(
    duplicateState?.labels ?? [],
  );
  const [datasetSplit, setDatasetSplit] = useState<DatasetSplit>(
    duplicateState?.datasetSplit ?? { train: 70, validation: 20, test: 10 },
  );
  // Preprocessing + augmentation UI is hidden; values come from a duplicated
  // model's payload (when duplicating) or default to empty.
  const augmentations: AppliedAugmentation[] = duplicateState?.augmentations ?? [];
  const preprocessings: AppliedAugmentation[] = duplicateState?.preprocessings ?? [];
  const [trainingType, setTrainingType] = useState<ProjectTypeEnum>(
    duplicateState?.trainingType ?? ProjectTypeEnum.DETECTION,
  );
  const [annotationsUsed, setAnnotationsUsed] = useState<ProjectTypeEnum[]>(
    duplicateState?.annotationsUsed ?? [ProjectTypeEnum.DETECTION],
  );
  const [customHyperparams, setCustomHyperparams] = useState(
    duplicateState?.customHyperparams ?? "",
  );
  const [hyperparamsError, setHyperparamsError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [epochsError, setEpochsError] = useState<string | null>(null);
  const didPrefillName = useRef(Boolean(duplicateState?.name));

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
      // Schema validation intentionally bypassed — any JSON object is accepted
      // const result = hyperparamsConfigSchema.safeParse(parsed);
      // if (!result.success) {
      //   const messages = result.error.issues
      //     .map((i) => `${i.path.join(".")}: ${i.message}`)
      //     .join("; ");
      //   setHyperparamsError(messages);
      //   return undefined;
      // }
      setHyperparamsError(null);
      return parsed;
    } catch {
      setHyperparamsError("Invalid JSON");
      return undefined;
    }
  };

  const saveModel = async (train = false) => {
    const trimmedName = name.trim();
    const nextNameError = trimmedName ? null : "Version name is required";
    const nextEpochsError =
      epochs > 0 ? null : "Epochs must be greater than 0";
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

    const newModel = await createModel({
      epochs,
      labelIds: activeLabels?.map((label) => label.id) || [],
      name,
      projectId: activeProject?.id!,
      splitTest: datasetSplit.test,
      splitTrain: datasetSplit.train,
      splitValidate: datasetSplit.validation,
      outputTypes: outputs,
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
            <Input
              type="number"
              min={1}
              value={epochs}
              onChange={(e) => {
                setEpochs(Number(e.target.value));
                if (epochsError) setEpochsError(null);
              }}
              placeholder="Epochs"
              aria-invalid={Boolean(epochsError) || undefined}
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
        />
        <DatasetSplitSettings split={datasetSplit} onChange={setDatasetSplit} />
        <AdvancedSettings
          outputs={outputs}
          onOutputsChange={setOutputs}
          customHyperparams={customHyperparams}
          onCustomHyperparamsChange={setCustomHyperparams}
          hyperparamsError={hyperparamsError}
          onHyperparamsErrorChange={setHyperparamsError}
        />

        <div className="flex flex-row justify-end gap-2">
          <Button onClick={() => saveModel()}>Save</Button>
          <Button onClick={() => saveModel(true)}>Save &amp; Train</Button>
        </div>
      </div>
    </ModelLayout>
  );
};
