import type {
  NNRuntimeConfig,
  SahiConfig,
} from "@/core/cameraApi/schemas/nn";
import { useImperativeHandle, type Ref } from "react";
import { CameraConfigPanel } from "./CameraConfigPanel";
import { CameraPreview } from "./CameraPreview";
import { NNRuntimePanel } from "./NNRuntimePanel";
import { ZonePositionPanel } from "./ZonePositionPanel";
import { SahiConfigPanel } from "./SahiConfigPanel";
import { useConfigurationState } from "./useConfigurationState";

export interface ConfigurationTabHandle {
  saveIfDirty: () => Promise<{ capturedVideoId: number | null }>;
}

interface ConfigurationTabProps {
  projectId: number;
  configId: number | null;
  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
  runtimeConfig: NNRuntimeConfig;
  onRuntimeConfigChange: (config: NNRuntimeConfig) => void;
  ref?: Ref<ConfigurationTabHandle>;
}

export const ConfigurationTab = ({
  projectId,
  configId,
  sahiConfig,
  onSahiConfigChange,
  runtimeConfig,
  onRuntimeConfigChange,
  ref,
}: ConfigurationTabProps) => {
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
    <ConfigurationTabContent
      ref={ref}
      projectId={projectId}
      configId={configId}
      sahiConfig={sahiConfig}
      onSahiConfigChange={onSahiConfigChange}
      runtimeConfig={runtimeConfig}
      onRuntimeConfigChange={onRuntimeConfigChange}
    />
  );
};

const ConfigurationTabContent = ({
  projectId,
  configId,
  sahiConfig,
  onSahiConfigChange,
  runtimeConfig,
  onRuntimeConfigChange,
  ref,
}: {
  projectId: number;
  configId: number;
  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
  runtimeConfig: NNRuntimeConfig;
  onRuntimeConfigChange: (config: NNRuntimeConfig) => void;
  ref?: Ref<ConfigurationTabHandle>;
}) => {
  const {
    cameras,
    streams,
    trainedModels,
    capturedVideos,
    previewImageUrl,
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
  } = useConfigurationState(projectId, configId);

  useImperativeHandle(
    ref,
    () => ({
      saveIfDirty: async () => {
        if (hasChanges) return await handleSave();
        return { capturedVideoId: selectedVideoId };
      },
    }),
    [hasChanges, handleSave, selectedVideoId],
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-xl font-semibold">Configuration</h1>

        <div className="flex flex-col gap-2 rounded-xl lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 flex-1 rounded-xl bg-card lg:flex-3/5">
            <ZonePositionPanel value={zoneConfig} onChange={setZoneConfig} />

            <CameraPreview imageUrl={previewImageUrl} zoneConfig={zoneConfig} />
          </div>

          <CameraConfigPanel
            cameras={cameras}
            streams={streams}
            trainedModels={trainedModels}
            capturedVideos={capturedVideos}
            selectedCamera={selectedCamera}
            onCameraChange={(mxid) => {
              setSelectedCamera(mxid);
              setSelectedStream(null);
            }}
            selectedStream={selectedStream}
            onStreamChange={setSelectedStream}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            onModelClear={() => setSelectedModelId(null)}
            selectedVideoId={selectedVideoId}
            onVideoChange={setSelectedVideoId}
          />
        </div>

        <NNRuntimePanel
          value={runtimeConfig}
          onChange={onRuntimeConfigChange}
        />

        <SahiConfigPanel value={sahiConfig} onChange={onSahiConfigChange} />
      </div>
    </div>
  );
};
