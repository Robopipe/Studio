import { useListStreamsQuery } from "@/core/cameraApi";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import {
  useGetCapturedVideosQuery,
  useGetTasksQuery,
} from "@/modules/capture/services/captureApi";
import { useGetModelsQuery } from "@/modules/model/services";
import {
  useGetRunConfigQuery,
  useUpdateRunConfigMutation,
} from "@/modules/run/services/runConfigApi";
import { ModelStatusEnum } from "@repo/schema";
import { useEffect, useState } from "react";

export const useConfigurationState = (projectId: number) => {
  const { data: config } = useGetRunConfigQuery({ projectId });
  const { data: models = [] } = useGetModelsQuery({ projectId });
  const [updateConfig, { isLoading: isSaving }] = useUpdateRunConfigMutation();
  const { data: tasks } = useGetTasksQuery({ projectId, limit: 1 });
  const { data: capturedVideosPage } = useGetCapturedVideosQuery({
    projectId,
    limit: 100,
    order: "desc",
  });
  const capturedVideos = capturedVideosPage?.data ?? [];

  const trainedModels = models.filter((m) => m.status === ModelStatusEnum.DONE);

  // Camera + stream come from the project-wide selection so changes here
  // propagate to Capture and vice versa (per client spec). The camera is the
  // project's DB setting (project modal); the config only carries the stream.
  // Model and replay video stay local — they're per-config, not per-project.
  const {
    cameraMxid: selectedCamera,
    streamName: selectedStream,
    setStream: setSelectedStream,
  } = useSelectedCameraStream();

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const { data: streams } = useListStreamsQuery(selectedCamera!, {
    skip: !selectedCamera,
  });

  // When the config loads, seed the slice from its persisted stream — the
  // camera is centralized (project modal). Model/video are local form state.
  useEffect(() => {
    if (config) {
      if (config.streamName) {
        setSelectedStream(config.streamName);
      }
      setSelectedModelId(
        config.modelId != null ? String(config.modelId) : null,
      );
      setSelectedVideoId(config.capturedVideoId ?? null);
    }
  }, [config, setSelectedStream]);

  const hasChanges =
    config != null &&
    (selectedStream !== config.streamName ||
      (selectedModelId === null
        ? config.modelId != null
        : Number(selectedModelId) !== config.modelId) ||
      selectedVideoId !== (config.capturedVideoId ?? null));

  const handleSave = async (): Promise<{
    capturedVideoId: number | null;
    modelId: number | null;
  }> => {
    const modelId = selectedModelId === null ? null : Number(selectedModelId);
    await updateConfig({
      projectId,
      streamName: selectedStream,
      modelId,
      capturedVideoId: selectedVideoId,
    }).unwrap();
    return { capturedVideoId: selectedVideoId, modelId };
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
    hasChanges,
    handleSave,
    isSaving,
  };
};
