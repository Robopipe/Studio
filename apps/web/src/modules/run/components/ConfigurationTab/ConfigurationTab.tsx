import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { useImperativeHandle, type Ref } from "react";
import { CameraPreview } from "./CameraPreview";
import { ConfigurationSidebar } from "./ConfigurationSidebar";
import { useConfigurationState } from "./useConfigurationState";

export interface ConfigurationTabHandle {
  saveIfDirty: () => Promise<{ capturedVideoId: number | null }>;
}

interface ConfigurationTabProps {
  projectId: number;
  configId: number | null;
  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
  ref?: Ref<ConfigurationTabHandle>;
}

export const ConfigurationTab = ({
  projectId,
  configId,
  sahiConfig,
  onSahiConfigChange,
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
    />
  );
};

const ConfigurationTabContent = ({
  projectId,
  configId,
  sahiConfig,
  onSahiConfigChange,
  ref,
}: {
  projectId: number;
  configId: number;
  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
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
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <ConfigurationSidebar
        trainedModels={trainedModels}
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        onModelClear={() => setSelectedModelId(null)}
        zoneConfig={zoneConfig}
        onZoneConfigChange={setZoneConfig}
        cameras={cameras}
        streams={streams}
        selectedCamera={selectedCamera}
        onCameraChange={(mxid) => {
          setSelectedCamera(mxid);
          setSelectedStream(null);
        }}
        selectedStream={selectedStream}
        onStreamChange={setSelectedStream}
        capturedVideos={capturedVideos}
        selectedVideoId={selectedVideoId}
        onVideoChange={setSelectedVideoId}
        sahiConfig={sahiConfig}
        onSahiConfigChange={onSahiConfigChange}
      />

      <main className="flex min-w-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <CameraPreview imageUrl={previewImageUrl} zoneConfig={zoneConfig} />
      </main>
    </div>
  );
};
