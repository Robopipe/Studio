import { Stack, Text } from "@repo/ui";
import { LayoutDashboard } from "lucide-react";
import styles from "./DashboardRuntimePage.module.scss";

export interface DashboardRuntimePageProps {
  configId: number;
  dashboardUrl: string | null;
}

export const DashboardRuntimePage = ({
  dashboardUrl,
}: DashboardRuntimePageProps) => {
  if (dashboardUrl) {
    return <iframe src={dashboardUrl} className={styles.dashboardFrame} />;
  }

  return (
    <Stack align="center" justify="center" className={styles.placeholder}>
      <div className={styles.placeholderIcon}>
        <LayoutDashboard />
      </div>
      <Text variant="text-16" weight="600" className={styles.placeholderTitle}>
        Dashboard is not running
      </Text>
      <Text variant="text-14" className={styles.placeholderSubtitle}>
        Configure your setup and click Deploy in the tab bar to start the dashboard.
      </Text>
    </Stack>
  );
};
