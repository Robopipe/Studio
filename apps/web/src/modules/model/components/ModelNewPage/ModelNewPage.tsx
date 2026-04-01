import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { hyperparamsConfigSchema, Label, ModelOutputTypeEnum, ProjectTypeEnum } from "@repo/schema";
import { Button, NumberInput, Stack, Text, TextInput } from "@repo/ui";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateModelMutation, useTrainModelMutation } from "../../services";
import { AdvancedSettings } from "../AdvancedSettings";
import {
  AppliedAugmentation,
  AugmentationSettings,
} from "../AugmentationSettings";
import { PreprocessingSettings } from "../PreprocessingSettings";
import { DatasetSplit, DatasetSplitSettings } from "../DatasetSplitSettings";
import { ModelLayout } from "../ModelLayout/ModelLayout";
import { ModelTypeSettings } from "../ModelTypeSettings";
import { SourceImagesSettings } from "../SourceImagesSettings";
import styles from "./ModelNewPage.module.scss";

export interface ModelNewPageProps {}

export const ModelNewPage = ({}: ModelNewPageProps) => {
  const navigate = useNavigate();
  const [activeProject] = useActiveProject();
  const [name, setName] = useState("");
  const [epochs, setEpochs] = useState(10);
  const [createModel] = useCreateModelMutation();
  const [trainModel] = useTrainModelMutation();
  const [outputs, setOutputs] = useState<ModelOutputTypeEnum[]>([
    ModelOutputTypeEnum.RAW,
    ModelOutputTypeEnum.RVC4,
  ]);
  const [activeLabels, setActiveLabels] = useState<Label[]>([]);
  const [datasetSplit, setDatasetSplit] = useState<DatasetSplit>({
    train: 70,
    validation: 20,
    test: 10,
  });
  const [augmentations, setAugmentations] = useState<AppliedAugmentation[]>([]);
  const [preprocessings, setPreprocessings] = useState<AppliedAugmentation[]>([]);
  const [preprocessingKeepOriginals, setPreprocessingKeepOriginals] = useState(true);
  const [trainingType, setTrainingType] = useState<ProjectTypeEnum>(
    activeProject?.type ?? ProjectTypeEnum.DETECTION,
  );
  const [annotationsUsed, setAnnotationsUsed] = useState<ProjectTypeEnum[]>(
    activeProject ? [activeProject.type] : [ProjectTypeEnum.DETECTION],
  );
  const [customHyperparams, setCustomHyperparams] = useState("");
  const [hyperparamsError, setHyperparamsError] = useState<string | null>(null);

  const parseHyperparams = (): Record<string, unknown> | undefined => {
    if (!customHyperparams.trim()) return {};
    try {
      const parsed = JSON.parse(customHyperparams);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        setHyperparamsError("Must be a JSON object");
        return undefined;
      }
      const result = hyperparamsConfigSchema.safeParse(parsed);
      if (!result.success) {
        const messages = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        setHyperparamsError(messages);
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
    const parsedHyperparams = parseHyperparams();
    if (parsedHyperparams === undefined) return;

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
      augmentations,
      preprocessings,
      preprocessingKeepOriginals,
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
      <Stack gap={16} className={styles.modelNewPage}>
        <Text weight="700">CREATE NEW VERSION</Text>
        <Text as="p">
          Prepare your images and data for training by compiling them into a
          dataset. Experiment with different configurations to achieve better
          training results
        </Text>
        <Stack direction="row" align="center">
          <Stack direction="row" align="center">
            <Text weight="500" as="p" variant="text-14">
              Version name
            </Text>
            <TextInput
              label=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </Stack>
          <NumberInput
            label="Epochs"
            value={epochs}
            min={1}
            onChange={(e) => setEpochs(Number(e.target.value))}
            style={{ width: "30%" }}
          />
        </Stack>
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
        <PreprocessingSettings
          preprocessings={preprocessings}
          onChange={setPreprocessings}
          keepOriginals={preprocessingKeepOriginals}
          onKeepOriginalsChange={setPreprocessingKeepOriginals}
        />
        <AugmentationSettings
          augmentations={augmentations}
          onChange={setAugmentations}
        />

        <AdvancedSettings
          outputs={outputs}
          onOutputsChange={setOutputs}
          customHyperparams={customHyperparams}
          onCustomHyperparamsChange={setCustomHyperparams}
          hyperparamsError={hyperparamsError}
          onHyperparamsErrorChange={setHyperparamsError}
        />

        <Stack direction="row" justify="end">
          <Button onClick={() => saveModel()}>Save</Button>
          <Button onClick={() => saveModel(true)}>Save & Train</Button>
        </Stack>
      </Stack>
    </ModelLayout>
  );
};
