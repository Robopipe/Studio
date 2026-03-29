import { Button } from "@/modules/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";

interface Camera {
  mxid: string;
  camera_name: string;
}

interface Stream {
  name: string;
}

interface TrainedModel {
  id: number;
  name: string;
}

interface CameraConfigPanelProps {
  cameras: Camera[] | undefined;
  streams: Stream[] | undefined;
  trainedModels: TrainedModel[];
  selectedCamera: string | null;
  onCameraChange: (mxid: string | null) => void;
  selectedStream: string | null;
  onStreamChange: (name: string | null) => void;
  selectedModelId: string | null;
  onModelChange: (id: string | null) => void;
  onModelClear: () => void;
}

export const CameraConfigPanel = ({
  cameras,
  streams,
  trainedModels,
  selectedCamera,
  onCameraChange,
  selectedStream,
  onStreamChange,
  selectedModelId,
  onModelChange,
  onModelClear,
}: CameraConfigPanelProps) => {
  return (
    <div className="flex w-96 shrink-0 flex-col gap-6 p-6 bg-card rounded-xl">
      <h2 className="text-sm font-semibold">Camera Configuration</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Camera</label>
          <Select
            value={selectedCamera ?? undefined}
            onValueChange={onCameraChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera">
                {cameras?.find((c) => c.mxid === selectedCamera)?.camera_name}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Sensor</label>
          <Select
            value={selectedStream ?? undefined}
            onValueChange={onStreamChange}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Model</label>
          <Select
            value={selectedModelId ?? undefined}
            onValueChange={onModelChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None selected">
                {
                  trainedModels.find((m) => String(m.id) === selectedModelId)
                    ?.name
                }
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
          {selectedModelId !== null && (
            <Button
              size="sm"
              variant="ghost"
              className="self-start px-0 text-xs text-muted-foreground"
              onClick={onModelClear}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
