import {
  useGetAvailableStreamConfigsQuery,
  useGetStreamConfigQuery,
  useUpdateStreamConfigMutation,
} from "@/core/cameraApi";
import type { ImgResizeMode, StillConfig } from "@/core/cameraApi/schemas";
import { imgResizeModeSchema } from "@/core/cameraApi/schemas";
import { useAppDispatch } from "@/hooks/redux";
import { bumpPipeline } from "@/modules/camera-stream/services/cameraPipelineGenerationSlice";
import { Alert, AlertDescription } from "@/modules/shadcn/ui/alert";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { ChevronDown, ChevronUp, Info, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useVideoCapture } from "../../context/VideoCaptureContext";
import { SelectParameter } from "../SelectParameter";

export interface SensorConfigProps {
  selectedCamera: string;
  selectedStream: string;
  isIntervalCapturing?: boolean;
  onIntervalCapturingChange?: (value: boolean) => void;
}

export const SensorConfig = ({
  selectedCamera,
  selectedStream,
  isIntervalCapturing = false,
  onIntervalCapturingChange,
}: SensorConfigProps) => {
  const streamKey = { mxid: selectedCamera, streamName: selectedStream };
  const dispatch = useAppDispatch();
  const { isRecording, stopAndDiscardRecording } = useVideoCapture();

  const { data: config, isLoading: isConfigLoading } =
    useGetStreamConfigQuery(streamKey);
  const { data: available, isLoading: isAvailableLoading } =
    useGetAvailableStreamConfigsQuery(streamKey);
  const [updateStreamConfig, { isLoading: isSaving }] =
    useUpdateStreamConfigMutation();

  const [draft, setDraft] = useState<StillConfig | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleConfirm = async () => {
    if (!draft) return;
    if (isRecording) {
      await stopAndDiscardRecording();
    }
    if (isIntervalCapturing) {
      onIntervalCapturingChange?.(false);
    }
    try {
      await updateStreamConfig({
        mxid: selectedCamera,
        streamName: selectedStream,
        config: draft,
      }).unwrap();
      dispatch(
        bumpPipeline({ mxid: selectedCamera, streamName: selectedStream }),
      );
      toast.success("Sensor config saved");
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to save sensor config");
    }
  };

  const onDiscard = () => {
    if (config) setDraft(config);
  };

  const isLoading = isConfigLoading || isAvailableLoading;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-black/3 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black">
              Sensor config
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                isCollapsed ? "Expand sensor config" : "Collapse sensor config"
              }
              onClick={() => setIsCollapsed((v) => !v)}
            >
              {isCollapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </Button>
          </div>

          {!isCollapsed && (
            <>
              <Alert className="py-2">
                <Info />
                <AlertDescription className="text-nowrap">
                  Applies to still image captures only — not the live video
                  stream.
                </AlertDescription>
              </Alert>

              {isLoading ||
              !draft ||
              !config ||
              availableSorted.length === 0 ? (
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
                        <SelectTrigger size="sm" className="h-8 w-40 text-xs">
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
                      <span className="flex-1 truncate text-foreground/90">
                        FPS
                      </span>
                      <NumberInput
                        className="h-8 w-40 text-xs"
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
                      onClick={() => setConfirmOpen(true)}
                    >
                      Save
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !o && !isSaving && setConfirmOpen(false)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Save sensor config?
            </DialogTitle>
            <DialogDescription>
              This will drop the live preview and reconnect. The camera will be
              unavailable for a few seconds.
              {isRecording && (
                <>
                  {" "}
                  You're currently recording. Saving will discard the
                  in-progress recording.
                </>
              )}
              {isIntervalCapturing && (
                <> Interval shooting is in progress. Saving will stop it.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
