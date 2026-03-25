import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/modules/shadcn/ui/collapsible";
import { Textarea } from "@/modules/shadcn/ui/textarea";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Label, ModelOutputTypeEnum, ProjectTypeEnum } from "@repo/schema";
import { Button, NumberInput, Stack, Text, TextInput } from "@repo/ui";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateModelMutation, useTrainModelMutation } from "../../services";
import {
  AppliedAugmentation,
  AugmentationSettings,
} from "../AugmentationSettings";
import { DatasetSplit, DatasetSplitSettings } from "../DatasetSplitSettings";
import { ModelLayout } from "../ModelLayout/ModelLayout";
import { ModelTypeSettings } from "../ModelTypeSettings";
import { SettingsCard } from "../SettingsCard";
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
        <AugmentationSettings
          augmentations={augmentations}
          onChange={setAugmentations}
        />

        <SettingsCard
          stepNumber={5}
          state={customHyperparams.trim() ? "complete" : "pending"}
          title="Advanced Options"
        >
          <Stack style={{ flex: 1 }}>
          <Collapsible>
            <CollapsibleTrigger>Output Formats</CollapsibleTrigger>
            <CollapsiblePanel>
              <Stack gap={8}>
                <Text variant="text-12">
                  Choose which export formats to generate after training. RAW is
                  the unoptimized ONNX model. RVC2, RVC3, and RVC4 produce
                  hardware-optimized blobs for Luxonis cameras — select the
                  format matching your target device.
                </Text>
                <Stack direction="row" gap={8}>
                  {Object.values(ModelOutputTypeEnum).map((outputType) => (
                    <Button
                      key={outputType}
                      variant={outputs.includes(outputType) ? "filled" : "outlined"}
                      onClick={() => {
                        if (outputs.includes(outputType)) {
                          setOutputs(outputs.filter((t) => t !== outputType));
                        } else {
                          setOutputs([...outputs, outputType]);
                        }
                      }}
                    >
                      {outputType}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </CollapsiblePanel>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Custom Training Hyperparameters</CollapsibleTrigger>
            <CollapsiblePanel>
              <Stack gap={8}>
                <Textarea
                  placeholder='{"trainer": {"optimizer": {"params": {"lr": 0.001}}}}'
                  value={customHyperparams}
                  onChange={(e) => {
                    setCustomHyperparams(e.target.value);
                    setHyperparamsError(null);
                  }}
                  rows={6}
                />
                {hyperparamsError && (
                  <Text variant="text-12" style={{ color: "var(--color-red-500)" }}>
                    {hyperparamsError}
                  </Text>
                )}
                <Text variant="text-12">
                  JSON object that deep-merges with the generated config. Top-level
                  keys: model, loader, trainer, tracker.
                </Text>
              </Stack>
            </CollapsiblePanel>
          </Collapsible>
          </Stack>
        </SettingsCard>

        <Stack direction="row" justify="end">
          <Button onClick={() => saveModel()}>Save</Button>
          <Button onClick={() => saveModel(true)}>Save & Train</Button>
        </Stack>
      </Stack>
    </ModelLayout>
  );
};
