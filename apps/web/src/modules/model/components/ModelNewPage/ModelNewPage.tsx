import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  // hyperparamsConfigSchema import kept for reference — validation intentionally bypassed
  // hyperparamsConfigSchema,
  Label as ProjectLabel,
  ModelOutputTypeEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useCreateModelMutation, useTrainModelMutation } from "../../services";
import { AdvancedSettings } from "../AdvancedSettings";
import { AppliedAugmentation } from "../AugmentationSettings/augmentationTypes";
// AugmentationSettings and PreprocessingSettings imports kept for future re-enablement
// import { AugmentationSettings } from "../AugmentationSettings";
// import { PreprocessingSettings } from "../PreprocessingSettings";
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
  const [trainModel] = useTrainModelMutation();
  const [name, setName] = useState(duplicateState?.name ?? "");
  const [epochs, setEpochs] = useState(duplicateState?.epochs ?? 10);
  const [outputs, setOutputs] = useState<ModelOutputTypeEnum[]>(
    duplicateState?.outputs ?? [ModelOutputTypeEnum.RAW, ModelOutputTypeEnum.RVC4],
  );
  const [activeLabels, setActiveLabels] = useState<ProjectLabel[]>(
    duplicateState?.labels ?? [],
  );
  const [datasetSplit, setDatasetSplit] = useState<DatasetSplit>(
    duplicateState?.datasetSplit ?? { train: 70, validation: 20, test: 10 },
  );
  // Setters prefixed with _ — cards are hidden but state is used by saveModel and retained for re-enablement
  const [augmentations, _setAugmentations] = useState<AppliedAugmentation[]>(
    duplicateState?.augmentations ?? [],
  );
  const [preprocessings, _setPreprocessings] = useState<AppliedAugmentation[]>(
    duplicateState?.preprocessings ?? [],
  );
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

  // Clear location state after reading to prevent re-prefill on refresh
  useEffect(() => {
    if (location.state?.duplicateFrom) {
      window.history.replaceState({}, "");
    }
  }, []);

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
    }).unwrap();
    if (train) {
      await trainModel({
        projectId: activeProject?.id!,
        modelId: newModel.id,
      }).unwrap();
    }
    navigate(`/projects/${activeProject?.id}/models/${newModel.id}`);
  };

  return (
    <ModelLayout>
      <div className="flex flex-col gap-4 pb-4">
        <span className="font-bold">CREATE NEW VERSION</span>
        <p>
          Prepare your images and data for training by compiling them into a
          dataset. Experiment with different configurations to achieve better
          training results
        </p>
        <div className="flex flex-row items-end gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="versionName">Version name</Label>
            <Input
              id="versionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <NumberInput
            label="Epochs"
            value={epochs}
            min={1}
            onChange={(e) => setEpochs(Number(e.target.value))}
            className="w-[30%]"
          />
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
        {/* Preprocessing and augmentation cards hidden — state and save logic retained for future re-enablement
        <PreprocessingSettings
          preprocessings={preprocessings}
          onChange={_setPreprocessings}
        />
        <AugmentationSettings
          augmentations={augmentations}
          onChange={_setAugmentations}
        /> */}

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
