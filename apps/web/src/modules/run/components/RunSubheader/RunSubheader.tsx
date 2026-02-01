import { Stack, Text } from "@repo/ui";
import styles from "./RunSubheader.module.scss";

export const RunSubheader = () => {
  return (
    <div className={styles.subheader}>
      <Stack direction="row" align="center" gap={8}>
        <div className={styles.tab}>
          <Text variant="text-14" weight="500">
            Inference
          </Text>
        </div>
      </Stack>
    </div>
  );
};
