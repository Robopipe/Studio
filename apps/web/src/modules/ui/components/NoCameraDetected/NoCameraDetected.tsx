import { Button, EthernetIcon, NoCameraIcon, RefreshIcon, Spinner, Stack, Text, USBIcon } from "@repo/ui";
import styles from "./NoCameraDetected.module.scss";

export interface NoCameraDetectedProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const NoCameraDetected = ({ onRefresh, isRefreshing }: NoCameraDetectedProps) => {
  return (
    <Stack align="center" justify="center" className={styles.container}>
      <div className={styles.iconWrapper}>
        <NoCameraIcon />
      </div>

      <Text variant="text-20" weight="600" className={styles.title}>
        No camera detected!
      </Text>

      <Text variant="text-14" className={styles.subtitle}>
        Please make sure camera is connected to the controller.
      </Text>

      <Stack direction="row" gap={16} className={styles.statusRow}>
        <div className={styles.statusBadge}>
          <USBIcon />
          <span>USB</span>
          <span className={styles.notDetected}>Not detected</span>
        </div>
        <div className={styles.statusBadge}>
          <EthernetIcon />
          <span>Ethernet</span>
          <span className={styles.notDetected}>Not detected</span>
        </div>
      </Stack>

      <Button
        variant="filled"
        onClick={onRefresh}
        disabled={isRefreshing}
        className={styles.refreshButton}
      >
        {isRefreshing ? <Spinner size="sm" style={{ "--color-primary": "#fff" } as React.CSSProperties} /> : <RefreshIcon />}
        Refresh
      </Button>

      <Stack gap={8} className={styles.helpLinks}>
        <a
          href="https://robopipe.gitbook.io/doc/getting-started/connection"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.helpLink}
        >
          Learn more how to connect camera
        </a>
      </Stack>
    </Stack>
  );
};
