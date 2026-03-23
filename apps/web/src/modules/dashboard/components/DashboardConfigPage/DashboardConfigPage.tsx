import { Stack } from "@repo/ui";
import { DashboardLineConfiguration } from "../DashboardLineConfiguration";

interface DashboardConfigPageProps {
  projectId: number;
  configId: number;
}

export const DashboardConfigPage = ({
  projectId,
  configId,
}: DashboardConfigPageProps) => {
  return (
    <Stack fullWidth gap="md">
      <DashboardLineConfiguration projectId={projectId} configId={configId} />
    </Stack>
  );
};
