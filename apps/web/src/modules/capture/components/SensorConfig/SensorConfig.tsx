import {
  useGetAvailableStreamConfigsQuery,
  useGetStreamConfigQuery,
  useUpdateStreamConfigMutation,
} from "@/core/cameraApi";
import type { ImgResizeMode, StillConfig } from "@/core/cameraApi/schemas";
import { imgResizeModeSchema } from "@/core/cameraApi/schemas";
import { Alert, AlertDescription } from "@/modules/shadcn/ui/alert";
import { Button } from "@/modules/shadcn/ui/button";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SelectParameter } from "../SelectParameter";

export interface SensorConfigProps {
  selectedCamera: string;
  selectedStream: string;
}

export const SensorConfig = ({
  selectedCamera,
  selectedStream,
}: SensorConfigProps) => {
  const streamKey = { mxid: selectedCamera, streamName: selectedStream };

  const { data: config, isLoading: isConfigLoading } =
    useGetStreamConfigQuery(streamKey);
  const { data: available, isLoading: isAvailableLoading } =
    useGetAvailableStreamConfigsQuery(streamKey);
  const [updateStreamConfig, { isLoading: isSaving }] =
    useUpdateStreamConfigMutation();

  const [draft, setDraft] = useState<StillConfig | null>(null);

  useEffect(() => {
    if (config) {
      setDraft(config);
    }
  }, [config]);

  const availableSorted = useMemo(() => {
    if (!available) return [];
    const seen = new Set<string>();
    return [...available]
      .sort((a, b) => b.width * b.height - a.width * a.height)
      .filter((o) => {
        const key = `${o.width}x${o.height}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [available]);

  const selectedOption = useMemo(
    () =>
      availableSorted.find(
        (o) => o.width === draft?.width && o.height === draft?.height,
      ),
    [availableSorted, draft?.width, draft?.height],
  );

  const isDirty =
    draft !== null &&
    config !== undefined &&
    (draft.width !== config.width ||
      draft.height !== config.height ||
      draft.fps !== config.fps ||
      draft.resize_mode !== config.resize_mode);

  const onResolutionChange = (value: string) => {
    const [w, h] = value.split("x").map(Number);
    const option = availableSorted.find((o) => o.width === w && o.height === h);
    if (!option || !draft) return;
    setDraft({
      ...draft,
      width: option.width,
      height: option.height,
      fps: option.max_fps,
    });
  };

  const onSave = async () => {
    if (!draft) return;
    try {
      await updateStreamConfig({
        mxid: selectedCamera,
        streamName: selectedStream,
        config: draft,
      }).unwrap();
      toast.success("Sensor config saved");
    } catch {
      toast.error("Failed to save sensor config");
    }
  };

  const onDiscard = () => {
    if (config) setDraft(config);
  };

  const isLoading = isConfigLoading || isAvailableLoading;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
        Sensor config
      </p>

      <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-black/3 px-5 py-4">
        <Alert>
          <Info />
          <AlertDescription>
            These settings apply only to still image captures. The live video
            stream uses its own configuration.
          </AlertDescription>
        </Alert>

        {isLoading || !draft || !config || availableSorted.length === 0 ? (
          <SensorConfigSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs leading-4">
                <Info className="size-4 shrink-0 text-foreground/40" />
                <span className="flex-1 truncate text-foreground/90">
                  Resolution
                </span>
                <Select
                  value={`${draft.width}x${draft.height}`}
                  onValueChange={(v) => v && onResolutionChange(v)}
                >
                  <SelectTrigger size="sm" className="h-8 min-w-40 text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSorted.map((o) => (
                      <SelectItem
                        key={`${o.width}x${o.height}`}
                        value={`${o.width}x${o.height}`}
                      >
                        {o.width} × {o.height}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs leading-4">
                <Info className="size-4 shrink-0 text-foreground/40" />
                <span className="flex-1 truncate text-foreground/90">FPS</span>
                <NumberInput
                  className="h-8 min-w-40 text-xs"
                  value={draft.fps}
                  min={selectedOption?.min_fps}
                  max={selectedOption?.max_fps}
                  step={1}
                  onValueChange={(v) =>
                    setDraft({ ...draft, fps: v ?? draft.fps })
                  }
                />
              </div>

              <SelectParameter
                label="Resize mode"
                value={draft.resize_mode}
                options={imgResizeModeSchema.options as string[]}
                onValueChange={(v) =>
                  setDraft({ ...draft, resize_mode: v as ImgResizeMode })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!isDirty || isSaving}
                onClick={onDiscard}
              >
                Discard changes
              </Button>
              <Button
                size="sm"
                disabled={!isDirty || isSaving}
                onClick={onSave}
              >
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SensorConfigSkeleton = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    <div className="flex justify-end gap-2">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-20" />
    </div>
  </div>
);
