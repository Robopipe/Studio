import { useListCamerasQuery, useListStreamsQuery } from "@/core/cameraApi";
import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { LineConfig } from "@/modules/dashboard/components/DashboardLineConfiguration";
import {
  useGetDashboardConfigQuery,
  useUpdateDashboardConfigMutation,
} from "@/modules/dashboard/services/dashboardConfigApi";
import { useGetModelsQuery } from "@/modules/model/services";
import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
  ModelStatusEnum,
} from "@repo/schema";
import { useEffect, useState } from "react";

const defaultLineConfig: LineConfig = {
  lineDirection: DashboardConfigurationLineDirectionEnum.HORIZONTAL,
  linePosition: 50,
  lineFlow: DashboardConfigurationLineFlowEnum.POSITIVE,
};

export const useConfigurationState = (
  projectId: number,
  configId: number,
) => {
  const { data: config } = useGetDashboardConfigQuery({ projectId, configId });
  const { data: cameras } = useListCamerasQuery();
  const { data: models = [] } = useGetModelsQuery({ projectId });
  const [updateConfig, { isLoading: isSaving }] =
    useUpdateDashboardConfigMutation();
  const { data: tasks } = useGetTasksQuery({ projectId, limit: 1 });

  const trainedModels = models.filter((m) => m.status === ModelStatusEnum.DONE);

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [lineConfig, setLineConfig] = useState<LineConfig>(defaultLineConfig);

  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });

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

  const hasChanges =
    config != null &&
    (selectedCamera !== config.cameraMxid ||
      selectedStream !== config.streamName ||
      (selectedModelId === null
        ? config.modelId != null
        : Number(selectedModelId) !== config.modelId) ||
      lineConfig.lineDirection !== config.lineDirection ||
      lineConfig.linePosition !== Math.round(config.linePosition * 100) ||
      lineConfig.lineFlow !== config.lineFlow);

  const handleSave = async () => {
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

  return {
    cameras,
    streams,
    trainedModels,
    previewImageUrl: tasks?.data[0]?.filePath,
    selectedCamera,
    setSelectedCamera,
    selectedStream,
    setSelectedStream,
    selectedModelId,
    setSelectedModelId,
    lineConfig,
    setLineConfig,
    hasChanges,
    handleSave,
    isSaving,
  };
};
