import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Button } from "@/modules/shadcn/ui/button";
import { useGetModelsQuery } from "@/modules/model/services";
import {
  DashboardConfigurationZoneDirectionEnum,
  ModelStatusEnum,
} from "@repo/schema";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetDashboardConfigQuery,
  useUpdateDashboardConfigMutation,
} from "../../services/dashboardConfigApi";
import {
  DashboardZoneConfiguration,
  ZoneConfig,
} from "../DashboardZoneConfiguration";

interface DashboardConfigPageProps {
  projectId: number;
  configId: number;
}

const defaultZoneConfig: ZoneConfig = {
  zoneDirection: DashboardConfigurationZoneDirectionEnum.HORIZONTAL,
  zoneCenter: 50,
  zoneThickness: 20,
  optimistic: true,
};

export const DashboardConfigPage = ({
  projectId,
  configId,
}: DashboardConfigPageProps) => {
  const { data: config } = useGetDashboardConfigQuery({ projectId, configId });
  const { data: models = [] } = useGetModelsQuery({ projectId });
  const [updateConfig, { isLoading: isSaving }] =
    useUpdateDashboardConfigMutation();

  const trainedModels = models.filter(
    (m) => m.status === ModelStatusEnum.DONE,
  );

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [zoneConfig, setZoneConfig] = useState<ZoneConfig>(defaultZoneConfig);

  useEffect(() => {
    if (config) {
      setSelectedModelId(
        config.modelId != null ? String(config.modelId) : null,
      );
      setZoneConfig({
        zoneDirection: config.zoneDirection,
        // DB stores 0-1, UI uses 0-100
        zoneCenter: Math.round(config.zoneCenter * 100),
        zoneThickness: Math.round(config.zoneThickness * 100),
        optimistic: config.optimistic,
      });
    }
  }, [config]);

  const hasModelChanges =
    config != null &&
    (selectedModelId === null
      ? config.modelId != null
      : Number(selectedModelId) !== config.modelId);

  const hasZoneChanges =
    config != null &&
    (zoneConfig.zoneDirection !== config.zoneDirection ||
      zoneConfig.zoneCenter !== Math.round(config.zoneCenter * 100) ||
      zoneConfig.zoneThickness !== Math.round(config.zoneThickness * 100) ||
      zoneConfig.optimistic !== config.optimistic);

  const hasChanges = hasModelChanges || hasZoneChanges;

  const handleSave = async () => {
    await updateConfig({
      projectId,
      configId,
      modelId: selectedModelId === null ? null : Number(selectedModelId),
      zoneDirection: zoneConfig.zoneDirection,
      zoneCenter: zoneConfig.zoneCenter / 100,
      zoneThickness: zoneConfig.zoneThickness / 100,
      optimistic: zoneConfig.optimistic,
    }).unwrap();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <DashboardZoneConfiguration
        projectId={projectId}
        value={zoneConfig}
        onChange={setZoneConfig}
      />

      <div className="flex flex-col gap-3">
        <h5 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
          Model
        </h5>

        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">
              Trained model
            </label>
            <Select
              value={selectedModelId}
              onValueChange={(value) => setSelectedModelId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {trainedModels.find((m) => String(m.id) === selectedModelId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {trainedModels.map((model) => (
                  <SelectItem key={model.id} value={String(model.id)}>
                    {model.name}
                  </SelectItem>
                ))}
                {trainedModels.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No trained models
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedModelId !== null && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedModelId(null)}
            >
              Clear
            </Button>
          )}
        </div>

        {trainedModels.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No trained models available. Train a model first to select it here.
          </p>
        )}
      </div>

      <div className="flex">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
