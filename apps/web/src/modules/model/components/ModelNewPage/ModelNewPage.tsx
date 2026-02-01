import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { ModelOutputTypeEnum } from "@repo/schema";
import { Button, NumberInput, Stack, Text, TextInput } from "@repo/ui";
import { useState } from "react";
import { useParams } from "react-router";
import { useCreateModelMutation, useTrainModelMutation } from "../../services";
import { ModelLayout } from "../ModelLayout/ModelLayout";
import { SettingsCard } from "../SettingsCard";
import { SourceImagesSettings } from "../SourceImagesSettings";
import styles from "./ModelNewPage.module.scss";

export interface ModelNewPageProps {}

export const ModelNewPage = ({}: ModelNewPageProps) => {
  const { projectId } = useParams();
  const { data: labels } = useGetProjectLabelsQuery({
    projectId: Number(projectId),
  });
  const [name, setName] = useState("");
  const [epochs, setEpochs] = useState(10);
  const [createModel] = useCreateModelMutation();
  const [trainModel] = useTrainModelMutation();

  const saveModel = async () => {
    const newModel = await createModel({
      epochs,
      labelIds: labels?.map((label) => label.id) || [],
      name,
      projectId: parseInt(projectId!),
      splitTest: 10,
      splitTrain: 70,
      splitValidate: 20,
      outputTypes: ["RVC2"] as ModelOutputTypeEnum[],
    }).unwrap();
    return newModel;
  };

  const saveAndTrain = async () => {
    const newModel = await saveModel();
    await trainModel({
      projectId: parseInt(projectId!),
      modelId: newModel.id,
    }).unwrap();
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
          {/* <NumberInput label="Version number" min={1} value={1} /> */}
          <NumberInput
            label="Epochs"
            value={epochs}
            min={1}
            onChange={(e) => setEpochs(Number(e.target.value))}
            style={{ width: "30%" }}
          />
        </Stack>
        <SettingsCard state="complete" stepNumber={1} title="source images">
          <SourceImagesSettings
            labels={labels ?? []}
            setActiveLabels={() => {}}
            activeLabels={[]}
          />
        </SettingsCard>
        <SettingsCard state="complete" stepNumber={1} title="train/test split">
          <div></div>
        </SettingsCard>
        <SettingsCard
          state="pending"
          stepNumber={3}
          title="image preprocessing"
        ></SettingsCard>
        <SettingsCard
          state="pending"
          stepNumber={4}
          title="augmentations"
        ></SettingsCard>
        <Stack direction="row" justify="end">
          <Button variant="outlined" disabled>
            Duplicate
          </Button>
          <Button onClick={saveModel}>Save</Button>
          <Button onClick={saveAndTrain}>Save & Train</Button>
        </Stack>
      </Stack>
    </ModelLayout>
  );
};
