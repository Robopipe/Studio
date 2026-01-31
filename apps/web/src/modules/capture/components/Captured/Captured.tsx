import { Stack, Text } from "@repo/ui";

import styles from "./Captured.module.scss";

export interface CapturedProps {}

export const Captured = ({}: CapturedProps) => {
  return (
    <Stack className={styles.captured}>
      <Text variant="text-10" weight="700">
        Captured images
      </Text>
    </Stack>
  );
};
