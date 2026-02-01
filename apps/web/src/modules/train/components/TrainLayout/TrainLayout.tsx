import { Container, Stack } from "@repo/ui";
import { ReactNode } from "react";
import { ModelList } from "../ModelList/ModelList";

export interface TrainLayoutProps {
  children?: ReactNode;
}

export const TrainLayout = ({ children }: TrainLayoutProps) => {
  return (
    <Container size="full">
      <Stack direction="row" justify="space-between">
        <ModelList />
        {children}
      </Stack>
    </Container>
  );
};
