import { useGetDashboardConfigsQuery } from "@/modules/dashboard/services/dashboardConfigApi";
import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { Text } from "@repo/ui";
import { SlidersHorizontal } from "lucide-react";
import styles from "./DeployConfigSelector.module.scss";

export interface ConfigSelection {
  configId: number;
  projectId: number;
}

interface DeployConfigSelectorProps {
  activeProjectId: number;
  activeConfigId: number | null;
  selectedConfigs: ConfigSelection[];
  onSelectionChange: (configs: ConfigSelection[]) => void;
}

export const DeployConfigSelector = ({
  activeProjectId,
  activeConfigId,
  selectedConfigs,
  onSelectionChange,
}: DeployConfigSelectorProps) => {
  const { data: projects = [] } = useGetProjectsQuery();

  const isSelected = (configId: number) =>
    selectedConfigs.some((s) => s.configId === configId);

  const isActiveConfig = (configId: number) => configId === activeConfigId;

  const handleToggle = (
    configId: number,
    projectId: number,
    checked: boolean,
  ) => {
    if (checked) {
      onSelectionChange([...selectedConfigs, { configId, projectId }]);
    } else {
      onSelectionChange(
        selectedConfigs.filter((s) => s.configId !== configId),
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="size-4" />
            Adjust deployed configurations
          </Button>
        }
      />
      <PopoverContent align="end" className={styles.content}>
        <Text variant="text-14" weight="600">
          Configurations to deploy
        </Text>
        <Text variant="text-12" className={styles.description}>
          The active configuration is always included. Select additional
          configurations to deploy alongside it.
        </Text>
        <div className={styles.list}>
          {projects.map((project) => (
            <ProjectConfigGroup
              key={project.id}
              projectId={project.id}
              projectName={project.name}
              activeProjectId={activeProjectId}
              isSelected={isSelected}
              isActiveConfig={isActiveConfig}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ProjectConfigGroup = ({
  projectId,
  projectName,
  activeProjectId,
  isSelected,
  isActiveConfig,
  onToggle,
}: {
  projectId: number;
  projectName: string;
  activeProjectId: number;
  isSelected: (configId: number) => boolean;
  isActiveConfig: (configId: number) => boolean;
  onToggle: (configId: number, projectId: number, checked: boolean) => void;
}) => {
  const { data: configs = [] } = useGetDashboardConfigsQuery({ projectId });
  const deployableConfigs = configs.filter((c) => c.modelId != null);

  if (deployableConfigs.length === 0) return null;

  const isActive = projectId === activeProjectId;

  return (
    <div className={styles.group}>
      <Text variant="text-12" weight="600" className={styles.groupTitle}>
        {projectName}
        {isActive && (
          <span className={styles.activeTag}>current</span>
        )}
      </Text>
      {deployableConfigs.map((config) => {
        const locked = isActiveConfig(config.id);
        const checked = locked || isSelected(config.id);
        return (
          <label key={config.id} className={styles.item}>
            <Checkbox
              checked={checked}
              disabled={locked}
              onCheckedChange={(val) =>
                onToggle(config.id, projectId, val as boolean)
              }
            />
            <Text variant="text-12">{config.name}</Text>
          </label>
        );
      })}
    </div>
  );
};
