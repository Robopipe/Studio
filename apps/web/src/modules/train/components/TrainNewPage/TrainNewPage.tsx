import { Container, Text } from "@repo/ui";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import { TrainLayout } from "../TrainLayout/TrainLayout";

export interface TrainNewPageProps {}

export const TrainNewPage = ({}: TrainNewPageProps) => {
  const [] = useState();
  return (
    <TrainLayout>
      <Container centered={false} size="xl">
        <Text weight="700">CREATE NEW VERSION</Text>
        <Text as="p">
          Prepare your images and data for training by compiling them into a
          dataset. Experiment with different configurations to achieve better
          training results
        </Text>
        <SettingsCard state="complete" stepNumber={1} title="source images">
          <div>ahoj</div>
        </SettingsCard>
      </Container>
    </TrainLayout>
  );
};
