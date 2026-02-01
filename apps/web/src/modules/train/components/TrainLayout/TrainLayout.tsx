import { Stack } from "@repo/ui";
import { ReactNode } from "react";
import { ModelList } from "../ModelList/ModelList";
import styles from "./TrainLayout.module.scss";

export interface TrainLayoutProps {
  children?: ReactNode;
}

export const TrainLayout = ({ children }: TrainLayoutProps) => {
  return (
    <Stack
      direction="row"
      justify="space-between"
      className={styles.trainLayout}
    >
      <ModelList className={styles.leftPanel} />
      <div className={styles.rightPanel}>{children}</div>
    </Stack>
  );
};
