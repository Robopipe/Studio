import { useGetDashboardConfigsQuery } from "@/modules/dashboard/services/dashboardConfigApi";
import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { SlidersHorizontal } from "lucide-react";

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
      <PopoverContent
        align="end"
        className="flex max-h-[400px] w-[320px] flex-col gap-3"
      >
        <span className="text-sm">Configurations to deploy</span>
        <span className="text-xs text-gray-500">
          The active configuration is always included. Select additional
          configurations to deploy alongside it.
        </span>
        <div className="flex flex-col gap-3 overflow-y-auto">
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
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-gray-600">
        {projectName}
        {isActive && (
          <span className="rounded bg-primary/10 px-1.5 text-[10px] font-medium leading-[18px] text-primary">
            current
          </span>
        )}
      </span>
      {deployableConfigs.map((config) => {
        const locked = isActiveConfig(config.id);
        const checked = locked || isSelected(config.id);
        return (
          <label
            key={config.id}
            className="flex cursor-pointer items-center gap-2 rounded py-0.5 pl-1 hover:bg-black/5"
          >
            <Checkbox
              checked={checked}
              disabled={locked}
              onCheckedChange={(val) =>
                onToggle(config.id, projectId, val as boolean)
              }
            />
            <span className="text-xs">{config.name}</span>
          </label>
        );
      })}
    </div>
  );
};
