import { CameraIcon, Spinner, Stack, Text } from "@repo/ui";
import styles from "./SearchingForCamera.module.scss";

export const SearchingForCamera = () => {
  return (
    <Stack align="center" justify="center" className={styles.container}>
      <div className={styles.iconWrapper}>
        <CameraIcon />
      </div>

      <Text variant="text-20" weight="600" className={styles.title}>
        Searching for camera...
      </Text>

      <Text variant="text-14" className={styles.subtitle}>
        Please make sure camera is connected to the controller.
      </Text>

      <Spinner />
    </Stack>
  );
};
