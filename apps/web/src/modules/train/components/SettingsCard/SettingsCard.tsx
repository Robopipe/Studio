import { Container, Stack, Text } from "@repo/ui";
import { ReactNode } from "react";

export type StepState = "pending" | "complete";

export interface SettingsCardProps {
  stepNumber: number;
  state: StepState;
  title: string;
  children?: ReactNode;
}

export const SettingsCard = (props: SettingsCardProps) => {
  const { stepNumber, state, title, children } = props;

  return (
    <Container size="sm">
      <Stack direction="row">
        <Stack>
            {state === "complete" ? ""}
          <Text>{title}</Text>
        </Stack>
        {children}
      </Stack>
    </Container>
  );
};
