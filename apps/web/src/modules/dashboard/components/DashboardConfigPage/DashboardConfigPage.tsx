import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Button } from "@/modules/shadcn/ui/button";
import { useGetModelsQuery } from "@/modules/model/services";
import { ModelStatusEnum } from "@repo/schema";
import { Stack } from "@repo/ui";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetDashboardConfigQuery,
  useUpdateDashboardConfigMutation,
} from "../../services/dashboardConfigApi";
import { DashboardLineConfiguration } from "../DashboardLineConfiguration";

interface DashboardConfigPageProps {
  projectId: number;
  configId: number;
}

const NO_MODEL = "__none__";

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

  const [selectedModelId, setSelectedModelId] = useState<string>(NO_MODEL);

  useEffect(() => {
    if (config?.modelId != null) {
      setSelectedModelId(String(config.modelId));
    } else {
      setSelectedModelId(NO_MODEL);
    }
  }, [config?.modelId]);

  const hasChanges =
    config != null &&
    (selectedModelId === NO_MODEL
      ? config.modelId != null
      : Number(selectedModelId) !== config.modelId);

  const handleSave = async () => {
    await updateConfig({
      projectId,
      configId,
      modelId: selectedModelId === NO_MODEL ? null : Number(selectedModelId),
    }).unwrap();
  };

  return (
    <Stack fullWidth gap="md">
      <DashboardLineConfiguration projectId={projectId} configId={configId} />

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
              onValueChange={(value) => setSelectedModelId(value ?? NO_MODEL)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No model selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MODEL}>No model</SelectItem>
                {trainedModels.map((model) => (
                  <SelectItem key={model.id} value={String(model.id)}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {trainedModels.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No trained models available. Train a model first to select it here.
          </p>
        )}
      </div>
    </Stack>
  );
};
