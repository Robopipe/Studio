import { CheckIcon, Container, Stack, Text } from "@repo/ui";
import { ReactNode } from "react";
import styles from "./SettingsCard.module.scss";

export type StepState = "pending" | "complete";

export interface SettingsCardProps {
  stepNumber: number;
  state: StepState;
  title: string;
  children?: ReactNode;
}

export const SettingsCard = (props: SettingsCardProps) => {
  const { title, children, state, stepNumber } = props;

  return (
    <Container size="full" className={styles.settingsCard}>
      <Stack direction="row">
        <Stack direction="row" align="center">
          <div>
            {state === "complete" ? (
              <div className={styles.icon}>
                <CheckIcon />
              </div>
            ) : (
              <Text
                variant="text-12"
                weight="500"
                className={styles.stepNumber}
              >
                {stepNumber}
              </Text>
            )}
          </div>
          <Text weight="500" variant="text-14" className={styles.title}>
            {title.toUpperCase()}
          </Text>
        </Stack>
        {children}
      </Stack>
    </Container>
  );
};
