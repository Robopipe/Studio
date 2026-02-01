import {
  Button,
  Container,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@repo/ui";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import { TrainLayout } from "../TrainLayout/TrainLayout";

export interface TrainNewPageProps {}

export const TrainNewPage = ({}: TrainNewPageProps) => {
  const [name, setName] = useState("");

  return (
    <TrainLayout>
      <Container centered={false} size="full">
        <Stack gap={16}>
          <Text weight="700">CREATE NEW VERSION</Text>
          <Text as="p">
            Prepare your images and data for training by compiling them into a
            dataset. Experiment with different configurations to achieve better
            training results
          </Text>
          <Stack direction="row" align="center">
            <TextInput
              label="Version name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {/* <NumberInput label="Version number" min={1} value={1} /> */}
            <NumberInput label="Epochs" min={1} value={10} />
          </Stack>
          <SettingsCard state="complete" stepNumber={1} title="source images">
            <div></div>
          </SettingsCard>
          <SettingsCard
            state="complete"
            stepNumber={1}
            title="train/test split"
          >
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
            <Button variant="outlined">Duplicate</Button>
            <Button>Save</Button>
            <Button>Save & Train</Button>
          </Stack>
        </Stack>
      </Container>
    </TrainLayout>
  );
};
