import { useListCamerasQuery, useListStreamsQuery } from "@/core/cameraApi";
import {
  useGetCapturedVideosQuery,
  useGetTasksQuery,
} from "@/modules/capture/services/captureApi";
import { ZoneConfig } from "@/modules/dashboard/components/DashboardZoneConfiguration";
import {
  useGetDashboardConfigQuery,
  useUpdateDashboardConfigMutation,
} from "@/modules/dashboard/services/dashboardConfigApi";
import { useGetModelsQuery } from "@/modules/model/services";
import {
  DashboardConfigurationZoneDirectionEnum,
  ModelStatusEnum,
} from "@repo/schema";
import { useEffect, useState } from "react";

const defaultZoneConfig: ZoneConfig = {
  zoneDirection: DashboardConfigurationZoneDirectionEnum.HORIZONTAL,
  zoneCenter: 50,
  zoneThickness: 20,
  optimistic: true,
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
  const { data: capturedVideosPage } = useGetCapturedVideosQuery({
    projectId,
    limit: 100,
    order: "desc",
  });
  const capturedVideos = capturedVideosPage?.data ?? [];

  const trainedModels = models.filter((m) => m.status === ModelStatusEnum.DONE);

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [zoneConfig, setZoneConfig] = useState<ZoneConfig>(defaultZoneConfig);

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
      setSelectedVideoId(config.capturedVideoId ?? null);
      setZoneConfig({
        zoneDirection: config.zoneDirection,
        zoneCenter: Math.round(config.zoneCenter * 100),
        zoneThickness: Math.round(config.zoneThickness * 100),
        optimistic: config.optimistic,
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
      selectedVideoId !== (config.capturedVideoId ?? null) ||
      zoneConfig.zoneDirection !== config.zoneDirection ||
      zoneConfig.zoneCenter !== Math.round(config.zoneCenter * 100) ||
      zoneConfig.zoneThickness !== Math.round(config.zoneThickness * 100) ||
      zoneConfig.optimistic !== config.optimistic);

  const handleSave = async () => {
    await updateConfig({
      projectId,
      configId,
      cameraMxid: selectedCamera,
      streamName: selectedStream,
      modelId: selectedModelId === null ? null : Number(selectedModelId),
      capturedVideoId: selectedVideoId,
      zoneDirection: zoneConfig.zoneDirection,
      zoneCenter: zoneConfig.zoneCenter / 100,
      zoneThickness: zoneConfig.zoneThickness / 100,
      optimistic: zoneConfig.optimistic,
    }).unwrap();
  };

  return {
    cameras,
    streams,
    trainedModels,
    capturedVideos,
    previewImageUrl: tasks?.data[0]?.filePath,
    selectedCamera,
    setSelectedCamera,
    selectedStream,
    setSelectedStream,
    selectedModelId,
    setSelectedModelId,
    selectedVideoId,
    setSelectedVideoId,
    zoneConfig,
    setZoneConfig,
    hasChanges,
    handleSave,
    isSaving,
  };
};
