import { Button } from "@/modules/shadcn/ui/button";
import { Stack, Text } from "@repo/ui";
import clsx from "clsx";
import { Play, Square } from "lucide-react";
import styles from "./RunSubheader.module.scss";

export type RunTab = "inference" | "dashboard" | "configuration";

interface RunSubheaderProps {
  activeTab: RunTab;
  onTabChange: (tab: RunTab) => void;
  onDeploy: () => void;
  onStop: () => void;
  isDeploying: boolean;
  canDeploy: boolean;
  isDeployed: boolean;
}

export const RunSubheader = ({
  activeTab,
  onTabChange,
  onDeploy,
  onStop,
  isDeploying,
  canDeploy,
  isDeployed,
}: RunSubheaderProps) => {
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
        <button
          className={clsx(styles.tab, activeTab === "configuration" && styles.active)}
          onClick={() => onTabChange("configuration")}
        >
          <Text variant="text-14" weight="500">
            Configuration
          </Text>
        </button>
      </Stack>

      <div className={styles.buttonGroup}>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isDeployed}
        >
          <Square className="size-4" />
          Stop
        </Button>
        <Button
          size="sm"
          onClick={onDeploy}
          disabled={!canDeploy || isDeploying}
        >
          <Play className="size-4" />
          {isDeploying ? "Deploying..." : "Deploy"}
        </Button>
      </div>
    </div>
  );
};
