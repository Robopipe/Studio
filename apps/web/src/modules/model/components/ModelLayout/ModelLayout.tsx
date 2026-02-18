import { Container, Stack } from "@repo/ui";
import { ReactNode } from "react";
import { ModelList } from "../ModelList/ModelList";
import styles from "./ModelLayout.module.scss";

export interface ModelLayoutProps {
  children?: ReactNode;
  className?: string;
}

export const ModelLayout = ({ children, className }: ModelLayoutProps) => {
  return (
    <Stack
      direction="row"
      justify="space-between"
      className={`${styles.modelLayout} ${className}`}
    >
      <ModelList className={styles.leftPanel} />
      <div className={styles.rightPanel}>
        <Container
          centered={false}
          size="full"
          className={styles.rightPanelContainer}
        >
          {children}
        </Container>
      </div>
    </Stack>
  );
};
