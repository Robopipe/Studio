import {
  useListCamerasQuery,
  useListStreamsQuery,
} from "@/core/cameraApi";
import { useGetModelsQuery } from "@/modules/model/services";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import {
  DashboardLineConfiguration,
  LineConfig,
} from "@/modules/dashboard/components/DashboardLineConfiguration";
import {
  useGetDashboardConfigQuery,
  useUpdateDashboardConfigMutation,
} from "@/modules/dashboard/services/dashboardConfigApi";
import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
  ModelStatusEnum,
} from "@repo/schema";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfigurationTabProps {
  projectId: number;
  configId: number | null;
}

const defaultLineConfig: LineConfig = {
  lineDirection: DashboardConfigurationLineDirectionEnum.HORIZONTAL,
  linePosition: 50,
  lineFlow: DashboardConfigurationLineFlowEnum.POSITIVE,
};

export const ConfigurationTab = ({
  projectId,
  configId,
}: ConfigurationTabProps) => {
  const { data: config } = useGetDashboardConfigQuery(
    { projectId, configId: configId! },
    { skip: !configId },
  );
  const { data: cameras } = useListCamerasQuery();
  const { data: models = [] } = useGetModelsQuery({ projectId });
  const [updateConfig, { isLoading: isSaving }] =
    useUpdateDashboardConfigMutation();

  const trainedModels = models.filter(
    (m) => m.status === ModelStatusEnum.DONE,
  );

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [lineConfig, setLineConfig] = useState<LineConfig>(defaultLineConfig);

  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });

  // Initialize local state from persisted config
  useEffect(() => {
    if (config) {
      setSelectedCamera(config.cameraMxid);
      setSelectedStream(config.streamName);
      setSelectedModelId(
        config.modelId != null ? String(config.modelId) : null,
      );
      setLineConfig({
        lineDirection: config.lineDirection,
        linePosition: Math.round(config.linePosition * 100),
        lineFlow: config.lineFlow,
      });
    }
  }, [config]);

  const hasCameraChanges =
    config != null &&
    (selectedCamera !== config.cameraMxid ||
      selectedStream !== config.streamName);

  const hasModelChanges =
    config != null &&
    (selectedModelId === null
      ? config.modelId != null
      : Number(selectedModelId) !== config.modelId);

  const hasLineChanges =
    config != null &&
    (lineConfig.lineDirection !== config.lineDirection ||
      lineConfig.linePosition !== Math.round(config.linePosition * 100) ||
      lineConfig.lineFlow !== config.lineFlow);

  const hasChanges = hasCameraChanges || hasModelChanges || hasLineChanges;

  const handleSave = async () => {
    if (!configId) return;
    await updateConfig({
      projectId,
      configId,
      cameraMxid: selectedCamera,
      streamName: selectedStream,
      modelId: selectedModelId === null ? null : Number(selectedModelId),
      lineDirection: lineConfig.lineDirection,
      linePosition: lineConfig.linePosition / 100,
      lineFlow: lineConfig.lineFlow,
    }).unwrap();
  };

  if (!configId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No dashboard configuration available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      {/* Camera & Sensor */}
      <div className="flex flex-col gap-3">
        <h5 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
          Camera & Sensor
        </h5>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Camera</label>
            <Select
              value={selectedCamera ?? undefined}
              onValueChange={(value) => {
                setSelectedCamera(value);
                setSelectedStream(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select camera">
                  {cameras?.find((c) => c.mxid === selectedCamera)
                    ?.camera_name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {cameras?.map((camera) => (
                  <SelectItem key={camera.mxid} value={camera.mxid}>
                    {camera.camera_name}
                  </SelectItem>
                ))}
                {(!cameras || cameras.length === 0) && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No cameras found
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Sensor</label>
            <Select
              value={selectedStream ?? undefined}
              onValueChange={(value) => setSelectedStream(value)}
              disabled={!selectedCamera}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sensor">
                  {selectedStream}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {streams?.map((stream) => (
                  <SelectItem key={stream.name} value={stream.name}>
                    {stream.name}
                  </SelectItem>
                ))}
                {(!streams || streams.length === 0) && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    {selectedCamera
                      ? "No sensors found"
                      : "Select a camera first"}
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Line Configuration */}
      <DashboardLineConfiguration
        projectId={projectId}
        value={lineConfig}
        onChange={setLineConfig}
      />

      {/* Model */}
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
              value={selectedModelId ?? undefined}
              onValueChange={(value) => setSelectedModelId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {trainedModels.find(
                    (m) => String(m.id) === selectedModelId,
                  )?.name}
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

      {/* Save */}
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
