import { Button } from "@/modules/shadcn/ui/button";
import { Save } from "lucide-react";
import { CameraConfigPanel } from "./CameraConfigPanel";
import { CameraPreview } from "./CameraPreview";
import { LinePositionPanel } from "./LinePositionPanel";
import { useConfigurationState } from "./useConfigurationState";

interface ConfigurationTabProps {
  projectId: number;
  configId: number | null;
}

export const ConfigurationTab = ({
  projectId,
  configId,
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

  return <ConfigurationTabContent projectId={projectId} configId={configId} />;
};

const ConfigurationTabContent = ({
  projectId,
  configId,
}: {
  projectId: number;
  configId: number;
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
    lineConfig,
    setLineConfig,
    hasChanges,
    handleSave,
    isSaving,
  } = useConfigurationState(projectId, configId);

  return (
    <div className="flex min-h-full flex-col gap-6 bg-gray-100 p-6">
      <h1 className="text-xl font-semibold">Configuration</h1>

      <div className="flex max-h-130 overflow-hidden rounded-xl gap-2">
        <div className="flex flex-3/5 bg-card rounded-xl">
          <LinePositionPanel value={lineConfig} onChange={setLineConfig} />

          <CameraPreview imageUrl={previewImageUrl} lineConfig={lineConfig} />
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
