import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { formatDuration } from "@/lib/utils";
import {
  DirectionPicker,
  ZoneConfig,
} from "@/modules/dashboard/components/DashboardZoneConfiguration";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Switch } from "@/modules/shadcn/ui/switch";
import type { CapturedVideo } from "@repo/schema";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { SahiConfigPanel } from "./SahiConfigPanel";

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

interface ConfigurationSidebarProps {
  trainedModels: TrainedModel[];
  selectedModelId: string | null;
  onModelChange: (id: string | null) => void;
  onModelClear: () => void;

  zoneConfig: ZoneConfig;
  onZoneConfigChange: (value: ZoneConfig) => void;

  cameras: Camera[] | undefined;
  streams: Stream[] | undefined;
  selectedCamera: string | null;
  onCameraChange: (mxid: string | null) => void;
  selectedStream: string | null;
  onStreamChange: (name: string | null) => void;

  capturedVideos: CapturedVideo[];
  selectedVideoId: number | null;
  onVideoChange: (id: number | null) => void;

  sahiConfig: SahiConfig | null;
  onSahiConfigChange: (config: SahiConfig | null) => void;
}

export const ConfigurationSidebar = ({
  trainedModels,
  selectedModelId,
  onModelChange,
  onModelClear,
  zoneConfig,
  onZoneConfigChange,
  cameras,
  streams,
  selectedCamera,
  onCameraChange,
  selectedStream,
  onStreamChange,
  capturedVideos,
  selectedVideoId,
  onVideoChange,
  sahiConfig,
  onSahiConfigChange,
}: ConfigurationSidebarProps) => {
  const selectedVideo =
    selectedVideoId != null
      ? capturedVideos.find((v) => v.id === selectedVideoId)
      : undefined;

  return (
    <aside className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-r bg-card">
      <Section title="Model">
        <Field label="Model">
          <div className="relative">
            <Select
              key={selectedModelId ?? "empty"}
              value={selectedModelId ?? undefined}
              onValueChange={onModelChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {(value) =>
                    trainedModels.find((m) => String(m.id) === value)?.name ??
                    ""
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
              <ClearButton
                ariaLabel="Clear model"
                onClick={onModelClear}
              />
            )}
          </div>
        </Field>
      </Section>

      <Section title="Setup Line Position">
        <Field label="Direction">
          <div className="w-fit">
            <DirectionPicker
              value={zoneConfig.zoneDirection}
              onChange={(zoneDirection) =>
                onZoneConfigChange({ ...zoneConfig, zoneDirection })
              }
            />
          </div>
        </Field>
        <Field label="Position">
          <PercentInput
            value={zoneConfig.zoneCenter}
            onChange={(v) =>
              onZoneConfigChange({ ...zoneConfig, zoneCenter: v })
            }
          />
        </Field>
        <Field label="Width">
          <PercentInput
            value={zoneConfig.zoneThickness}
            onChange={(v) =>
              onZoneConfigChange({ ...zoneConfig, zoneThickness: v })
            }
          />
        </Field>
        <div className="flex items-center justify-between gap-3 pt-1">
          <Label
            htmlFor="run-zone-optimistic"
            className="text-sm text-muted-foreground"
          >
            Optimistic
          </Label>
          <Switch
            id="run-zone-optimistic"
            checked={zoneConfig.optimistic}
            onCheckedChange={(checked) =>
              onZoneConfigChange({ ...zoneConfig, optimistic: checked })
            }
          />
        </div>
      </Section>

      <Section title="Camera Configuration">
        <Field label="Camera">
          <Select
            value={selectedCamera ?? undefined}
            onValueChange={onCameraChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera">
                {(value) =>
                  cameras?.find((c) => c.mxid === value)?.camera_name ?? ""
                }
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
        </Field>
        <Field label="Sensor">
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
                  {selectedCamera ? "No sensors found" : "Select a camera first"}
                </p>
              )}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Camera Mock">
        <Field label="Replay Video">
          <div className="relative">
            <Select
              key={selectedVideoId ?? "empty"}
              value={
                selectedVideoId != null ? String(selectedVideoId) : undefined
              }
              onValueChange={(val) => onVideoChange(Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {selectedVideoId == null
                    ? undefined
                    : selectedVideo
                      ? formatVideoLabel(selectedVideo)
                      : `#${selectedVideoId}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {capturedVideos.map((video) => (
                  <SelectItem key={video.id} value={String(video.id)}>
                    {formatVideoLabel(video)}
                  </SelectItem>
                ))}
                {capturedVideos.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No captured videos
                  </p>
                )}
              </SelectContent>
            </Select>
            {selectedVideoId !== null && (
              <ClearButton
                ariaLabel="Clear replay video"
                onClick={() => onVideoChange(null)}
              />
            )}
          </div>
        </Field>
      </Section>

      <SahiConfigPanel
        value={sahiConfig}
        onChange={onSahiConfigChange}
      />
    </aside>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4 border-b px-6 py-5 last:border-b-0">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </h2>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm text-muted-foreground">{label}</label>
    {children}
  </div>
);

const PercentInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="relative">
    <Input
      type="number"
      value={value}
      min={0}
      max={100}
      onChange={(e) => onChange(Number(e.target.value))}
      className="pr-8"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
      %
    </span>
  </div>
);

const ClearButton = ({
  ariaLabel,
  onClick,
}: {
  ariaLabel: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    onPointerDown={(e) => e.stopPropagation()}
    className="absolute right-8 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
  >
    <X className="size-3.5" />
  </button>
);

const formatVideoLabel = (video: CapturedVideo): string => {
  const date = new Date(video?.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `#${video.id} - ${date} - ${formatDuration(video.durationMs)}`;
};
