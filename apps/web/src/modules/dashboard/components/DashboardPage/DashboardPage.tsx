import { Stack, Text } from "@repo/ui";
import clsx from "clsx";
import { useState } from "react";
import { DashboardConfigPage } from "../DashboardConfigPage";

import styles from "./DashboardPage.module.scss";

type DashboardTab = "visualize" | "configuration";

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("configuration");

  return (
    <Stack className={styles.pageWrapper} gap={0}>
      {/* Sub-tab header */}
      <div className={styles.subheader}>
        <Stack direction="row" align="center" gap={24}>
          <button
            className={clsx(styles.tab, activeTab === "visualize" && styles.active)}
            onClick={() => setActiveTab("visualize")}
          >
            <Text variant="text-14" weight="500">
              Visualize
            </Text>
          </button>
          <button
            className={clsx(styles.tab, activeTab === "configuration" && styles.active)}
            onClick={() => setActiveTab("configuration")}
          >
            <Text variant="text-14" weight="500">
              Configuration
            </Text>
          </button>
        </Stack>
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {activeTab === "visualize" && (
          <Stack fullWidth align="center" justify="center" className={styles.placeholder}>
            <Text variant="text-14" className={styles.placeholderText}>
              Dashboard visualization coming soon.
            </Text>
          </Stack>
        )}
        {activeTab === "configuration" && <DashboardConfigPage />}
      </div>
    </Stack>
  );
};
