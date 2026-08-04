import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { useImperativeHandle, type Ref } from "react";
import { CameraPreview } from "./CameraPreview";
import { ConfigurationSidebar } from "./ConfigurationSidebar";
import { useConfigurationState } from "./useConfigurationState";

export interface ConfigurationTabHandle {
  saveIfDirty: () => Promise<{
    capturedVideoId: number | null;
    modelId: number | null;
  }>;
}

interface ConfigurationTabProps {
  projectId: number;
  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
  ref?: Ref<ConfigurationTabHandle>;
}

export const ConfigurationTab = ({
  projectId,
  sahiConfig,
  onSahiConfigChange,
  ref,
}: ConfigurationTabProps) => {
  const {
    streams,
    trainedModels,
    capturedVideos,
    previewImageUrl,
    selectedCamera,
    selectedStream,
    setSelectedStream,
    selectedModelId,
    setSelectedModelId,
    selectedVideoId,
    setSelectedVideoId,
    hasChanges,
    handleSave,
  } = useConfigurationState(projectId);

  useImperativeHandle(
    ref,
    () => ({
      saveIfDirty: async () => {
        if (hasChanges) return await handleSave();
        return {
          capturedVideoId: selectedVideoId,
          modelId: selectedModelId === null ? null : Number(selectedModelId),
        };
      },
    }),
    [hasChanges, handleSave, selectedVideoId, selectedModelId],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <ConfigurationSidebar
        trainedModels={trainedModels}
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        onModelClear={() => setSelectedModelId(null)}
        streams={streams}
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        onStreamChange={setSelectedStream}
        capturedVideos={capturedVideos}
        selectedVideoId={selectedVideoId}
        onVideoChange={setSelectedVideoId}
        sahiConfig={sahiConfig}
        onSahiConfigChange={onSahiConfigChange}
      />

      <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <p className="text-xl">Live stream</p>
        <CameraPreview
          imageUrl={previewImageUrl}
          selectedCamera={selectedCamera}
          selectedStream={selectedStream}
        />
      </main>
    </div>
  );
};
