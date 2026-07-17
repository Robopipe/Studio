import { useListCamerasQuery, useListStreamsQuery } from "@/core/cameraApi";
import { useSelectedCameraStream } from "@/modules/camera-selection";
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
  zoneDirection: DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP,
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

  // Camera + stream come from the project-wide selection slice so changes
  // here propagate to Capture and vice versa (per client spec). The camera
  // itself is a project-modal setting; configs only carry the stream. Model
  // and replay video stay local — they're per-config, not per-project.
  const {
    cameraMxid: selectedCamera,
    streamName: selectedStream,
    setStream: setSelectedStream,
  } = useSelectedCameraStream(cameras);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [zoneConfig, setZoneConfig] = useState<ZoneConfig>(defaultZoneConfig);

  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });

  // When a config opens, seed the slice from the config's persisted stream —
  // the camera is centralized (project modal) and no longer restored from
  // configs; legacy config.cameraMxid values are ignored. Model/video are
  // local (per-config).
  useEffect(() => {
    if (config) {
      if (config.streamName) {
        setSelectedStream(config.streamName);
      }
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
  }, [config, setSelectedStream]);

  const hasChanges =
    config != null &&
    (selectedStream !== config.streamName ||
      (selectedModelId === null
        ? config.modelId != null
        : Number(selectedModelId) !== config.modelId) ||
      selectedVideoId !== (config.capturedVideoId ?? null) ||
      zoneConfig.zoneDirection !== config.zoneDirection ||
      zoneConfig.zoneCenter !== Math.round(config.zoneCenter * 100) ||
      zoneConfig.zoneThickness !== Math.round(config.zoneThickness * 100) ||
      zoneConfig.optimistic !== config.optimistic);

  const handleSave = async (): Promise<{ capturedVideoId: number | null }> => {
    // cameraMxid is deliberately omitted — the camera is no longer persisted
    // per config; omitting leaves the legacy column value untouched.
    await updateConfig({
      projectId,
      configId,
      streamName: selectedStream,
      modelId: selectedModelId === null ? null : Number(selectedModelId),
      capturedVideoId: selectedVideoId,
      zoneDirection: zoneConfig.zoneDirection,
      zoneCenter: zoneConfig.zoneCenter / 100,
      zoneThickness: zoneConfig.zoneThickness / 100,
      optimistic: zoneConfig.optimistic,
    }).unwrap();
    return { capturedVideoId: selectedVideoId };
  };

  return {
    streams,
    trainedModels,
    capturedVideos,
    previewImageUrl: tasks?.data[0]?.filePath,
    selectedCamera,
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
