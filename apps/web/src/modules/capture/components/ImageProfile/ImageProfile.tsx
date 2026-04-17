import {
  SensorControl,
  SensorControlUpdate,
  SensorFocus,
  useGetStreamControlCapabilitiesQuery,
  useGetStreamControlQuery,
  useResetStreamControlMutation,
  useUpdateStreamControlMutation,
} from "@/core/cameraApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { ChevronDown, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

import { BooleanParameter } from "../BooleanParameter";
import { NumericParameter } from "../NumericParameter";
import { SelectParameter } from "../SelectParameter";

export interface ImageProfileProps {
  selectedCamera: string;
  selectedStream: string;
}

type FocusField = keyof SensorFocus;

const DEBOUNCE_MS = 300;

export const ImageProfile = ({
  selectedCamera,
  selectedStream,
}: ImageProfileProps) => {
  const streamKey = { mxid: selectedCamera, streamName: selectedStream };
  const { data: control, isLoading: isControlLoading } =
    useGetStreamControlQuery(streamKey);
  const { data: capabilities, isLoading: isCapsLoading } =
    useGetStreamControlCapabilitiesQuery(streamKey);

  const [updateStreamControl] = useUpdateStreamControlMutation();
  const [resetStreamControl, { isLoading: isResetting }] =
    useResetStreamControlMutation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const pendingRef = useRef<SensorControlUpdate>({});
  const controlRef = useRef<SensorControl | undefined>(control);
  useEffect(() => {
    controlRef.current = control;
  }, [control]);

  const flush = useDebounceCallback(() => {
    const body = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(body).length === 0) return;
    updateStreamControl({
      mxid: selectedCamera,
      streamName: selectedStream,
      control: body,
    });
  }, DEBOUNCE_MS);

  useEffect(() => {
    return () => {
      flush.flush();
    };
  }, [selectedCamera, selectedStream, flush]);

  const onChange = <K extends keyof SensorControl>(
    key: K,
    value: SensorControl[K],
  ) => {
    pendingRef.current = { ...pendingRef.current, [key]: value };
    if (key === "exposure_time" || key === "sensitivity_iso") {
      pendingRef.current.auto_exposure_enable = false;
    }
    flush();
  };

  const onFocusChange = <K extends FocusField>(
    key: K,
    value: SensorFocus[K],
  ) => {
    const base: SensorFocus | null =
      pendingRef.current.focus ?? controlRef.current?.focus ?? null;
    if (!base) return;
    pendingRef.current.focus = { ...base, [key]: value };
    flush();
  };

  const onReset = () => {
    pendingRef.current = {};
    flush.cancel();
    resetStreamControl({
      mxid: selectedCamera,
      streamName: selectedStream,
    });
  };

  const isLoading = isControlLoading || isCapsLoading;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
        Image Profile
      </p>

      <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-black/3 px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-medium leading-6 text-foreground">
            Profile setup
          </p>
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reset to defaults"
                disabled={isResetting}
                onClick={onReset}
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={isCollapsed ? "Expand profile" : "Collapse profile"}
              onClick={() => setIsCollapsed((v) => !v)}
            >
              {isCollapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <X className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {isLoading || !control || !capabilities ? (
              <ImageProfileSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <NumericParameter
                      label="Exposure time"
                      value={control.exposure_time}
                      min={capabilities.exposure_time.min}
                      max={capabilities.exposure_time.max}
                      step={capabilities.exposure_time.step ?? undefined}
                      scale="log"
                      onValueChange={(v) => onChange("exposure_time", v)}
                    />
                    <NumericParameter
                      label="ISO sensitivity"
                      value={control.sensitivity_iso}
                      min={capabilities.sensitivity_iso.min}
                      max={capabilities.sensitivity_iso.max}
                      step={capabilities.sensitivity_iso.step ?? undefined}
                      onValueChange={(v) => onChange("sensitivity_iso", v)}
                    />
                    <NumericParameter
                      label="Brightness"
                      value={control.brightness}
                      min={capabilities.brightness.min}
                      max={capabilities.brightness.max}
                      step={capabilities.brightness.step ?? undefined}
                      onValueChange={(v) => onChange("brightness", v)}
                    />
                    <NumericParameter
                      label="Contrast"
                      value={control.contrast}
                      min={capabilities.contrast.min}
                      max={capabilities.contrast.max}
                      step={capabilities.contrast.step ?? undefined}
                      onValueChange={(v) => onChange("contrast", v)}
                    />
                    {capabilities.saturation && (
                      <NumericParameter
                        label="Saturation"
                        value={control.saturation}
                        min={capabilities.saturation.min}
                        max={capabilities.saturation.max}
                        step={capabilities.saturation.step ?? undefined}
                        onValueChange={(v) => onChange("saturation", v)}
                      />
                    )}
                    <NumericParameter
                      label="Sharpness"
                      value={control.sharpness}
                      min={capabilities.sharpness.min}
                      max={capabilities.sharpness.max}
                      step={capabilities.sharpness.step ?? undefined}
                      onValueChange={(v) => onChange("sharpness", v)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <NumericParameter
                      label="Luma denoise"
                      value={control.luma_denoise}
                      min={capabilities.luma_denoise.min}
                      max={capabilities.luma_denoise.max}
                      step={capabilities.luma_denoise.step ?? undefined}
                      onValueChange={(v) => onChange("luma_denoise", v)}
                    />
                    {capabilities.chroma_denoise && (
                      <NumericParameter
                        label="Chroma denoise"
                        value={control.chroma_denoise}
                        min={capabilities.chroma_denoise.min}
                        max={capabilities.chroma_denoise.max}
                        step={capabilities.chroma_denoise.step ?? undefined}
                        onValueChange={(v) => onChange("chroma_denoise", v)}
                      />
                    )}
                    {capabilities.has_autofocus && control.focus && (
                      <>
                        <SelectParameter
                          label="Auto focus mode"
                          value={control.focus.auto_focus_mode}
                          options={capabilities.auto_focus_modes}
                          onValueChange={(v) =>
                            onFocusChange(
                              "auto_focus_mode",
                              v as SensorFocus["auto_focus_mode"],
                            )
                          }
                        />
                        {capabilities.lens_position && (
                          <NumericParameter
                            label="Lens position"
                            value={control.focus.lens_position}
                            min={capabilities.lens_position.min}
                            max={capabilities.lens_position.max}
                            step={capabilities.lens_position.step ?? undefined}
                            disabled={control.focus.auto_focus_mode !== "OFF"}
                            onValueChange={(v) =>
                              onFocusChange("lens_position", v)
                            }
                          />
                        )}
                      </>
                    )}

                    {capabilities.has_color_controls &&
                      capabilities.auto_whitebalance_modes && (
                        <>
                          <SelectParameter
                            label="Auto WB mode"
                            value={control.auto_whitebalance_mode}
                            options={capabilities.auto_whitebalance_modes}
                            onValueChange={(v) =>
                              onChange(
                                "auto_whitebalance_mode",
                                v as SensorControl["auto_whitebalance_mode"],
                              )
                            }
                          />
                          {capabilities.manual_whitebalance &&
                            control.auto_whitebalance_mode === "OFF" && (
                              <NumericParameter
                                label="Manual WB"
                                value={control.manual_whitebalance}
                                min={capabilities.manual_whitebalance.min}
                                max={capabilities.manual_whitebalance.max}
                                step={
                                  capabilities.manual_whitebalance.step ??
                                  undefined
                                }
                                onValueChange={(v) =>
                                  onChange("manual_whitebalance", v)
                                }
                              />
                            )}
                          {control.auto_whitebalance_mode !== "OFF" && (
                            <BooleanParameter
                              label="Auto WB lock"
                              value={control.auto_whitebalance_lock}
                              onValueChange={(v) =>
                                onChange("auto_whitebalance_lock", v)
                              }
                            />
                          )}
                        </>
                      )}

                    <SelectParameter
                      label="Anti-banding"
                      value={control.anti_banding_mode}
                      options={capabilities.anti_banding_modes}
                      onValueChange={(v) =>
                        onChange(
                          "anti_banding_mode",
                          v as SensorControl["anti_banding_mode"],
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ImageProfileSkeleton = () => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
    <div className="flex flex-col gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  </div>
);
