import { Stack, Text } from "@repo/ui";
import clsx from "clsx";
import styles from "./RunSubheader.module.scss";

export type RunTab = "inference" | "dashboard";

interface RunSubheaderProps {
  activeTab: RunTab;
  onTabChange: (tab: RunTab) => void;
}

export const RunSubheader = ({ activeTab, onTabChange }: RunSubheaderProps) => {
  return (
    <div className={styles.subheader}>
      <Stack direction="row" align="center" gap={24}>
        <button
          className={clsx(styles.tab, activeTab === "inference" && styles.active)}
          onClick={() => onTabChange("inference")}
        >
          <Text variant="text-14" weight="500">
            Inference
          </Text>
        </button>
        <button
          className={clsx(styles.tab, activeTab === "dashboard" && styles.active)}
          onClick={() => onTabChange("dashboard")}
        >
          <Text variant="text-14" weight="500">
            Dashboard
          </Text>
        </button>
      </Stack>
    </div>
  );
};
