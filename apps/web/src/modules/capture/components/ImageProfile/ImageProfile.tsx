import {
  SensorControl,
  sensorControlSchema,
  sensorFocusSchema,
  useGetStreamControlQuery,
  useUpdateStreamControlMutation,
} from "@/core/cameraApi";
import { cloneDeep, set } from "lodash";
import type { Path } from "react-hook-form";
import { useDebounceCallback } from "usehooks-ts";

import { BooleanParameter } from "../BooleanParameter";
import { NumericParameter } from "../NumericParameter";

export interface ImageProfileProps {
  selectedCamera: string;
  selectedStream: string;
}

export const ImageProfile = ({
  selectedCamera,
  selectedStream,
}: ImageProfileProps) => {
  const { data: streamControl } = useGetStreamControlQuery({
    mxid: selectedCamera,
    streamName: selectedStream,
  });

  const [updateStreamControl] = useUpdateStreamControlMutation();

  const debouncedUpdateStreamControl = useDebounceCallback(
    updateStreamControl,
    250,
  );

  const onChange = (key: Path<SensorControl>, value: number | boolean) => {
    if (!streamControl) return;

    const newControl = cloneDeep(streamControl);
    set(newControl, key, value);

    debouncedUpdateStreamControl({
      mxid: selectedCamera,
      streamName: selectedStream,
      control: newControl,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
        Image Profile
      </p>

      <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5">
        <p className="text-base font-bold leading-6 text-foreground">
          Profile setup
        </p>

        <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
          <NumericParameter
            value={streamControl?.exposure_time ?? null}
            schema={sensorControlSchema.shape.exposure_time}
            step={500}
            label="Exposure Time"
            onValueChange={(value) => {
              onChange("exposure_time", value);
            }}
          />

          <NumericParameter
            value={streamControl?.sensitivity_iso ?? null}
            schema={sensorControlSchema.shape.sensitivity_iso}
            step={100}
            label="ISO Sensitivity"
            onValueChange={(value) => {
              onChange("sensitivity_iso", value);
            }}
          />

          <NumericParameter
            value={streamControl?.brightness ?? null}
            schema={sensorControlSchema.shape.brightness}
            step={1}
            label="Brightness"
            onValueChange={(value) => {
              onChange("brightness", value);
            }}
          />

          <NumericParameter
            value={streamControl?.contrast ?? null}
            schema={sensorControlSchema.shape.contrast}
            step={1}
            label="Contrast"
            onValueChange={(value) => {
              onChange("contrast", value);
            }}
          />

          <NumericParameter
            value={streamControl?.saturation ?? null}
            schema={sensorControlSchema.shape.saturation}
            step={1}
            label="Saturation"
            onValueChange={(value) => {
              onChange("saturation", value);
            }}
          />

          <NumericParameter
            value={streamControl?.chroma_denoise ?? null}
            schema={sensorControlSchema.shape.chroma_denoise}
            step={1}
            label="Chroma Denoise"
            onValueChange={(value) => {
              onChange("chroma_denoise", value);
            }}
          />

          <NumericParameter
            value={streamControl?.luma_denoise ?? null}
            schema={sensorControlSchema.shape.luma_denoise}
            step={1}
            label="Luma Denoise"
            onValueChange={(value) => {
              onChange("luma_denoise", value);
            }}
          />
        </div>
          <div className="flex flex-col gap-2">
            <BooleanParameter
            value={streamControl?.auto_exposure_enable ?? false}
            label="Auto Exposure Enable"
            onValueChange={(value) => {
              onChange("auto_exposure_enable", value);
            }}
          />
          {streamControl?.auto_exposure_enable && (
            <>
              <NumericParameter
                value={streamControl?.auto_exposure_compensation ?? null}
                schema={sensorControlSchema.shape.auto_exposure_compensation}
                step={1}
                label="Auto Exposure Compensation"
                onValueChange={(value) => {
                  onChange("auto_exposure_compensation", value);
                }}
              />

              <NumericParameter
                value={streamControl?.auto_exposure_limit ?? null}
                schema={sensorControlSchema.shape.auto_exposure_limit}
                step={1000}
                label="Auto Exposure Limit"
                onValueChange={(value) => {
                  onChange("auto_exposure_limit", value);
                }}
              />

              <BooleanParameter
                value={streamControl?.auto_exposure_lock ?? false}
                label="Auto Exposure Lock"
                onValueChange={(value) => {
                  onChange("auto_exposure_lock", value);
                }}
              />
            </>
          )}

          <BooleanParameter
            value={streamControl?.auto_whitebalance_lock ?? false}
            label="Auto Whitebalance Lock"
            onValueChange={(value) => {
              onChange("auto_whitebalance_lock", value);
            }}
          />
          {streamControl?.auto_whitebalance_lock ? (
            <>
              {/* TODO: Auto whitebalance mode enum, consistent between cameras ? */}
            </>
          ) : (
            <>
              <NumericParameter
                value={streamControl?.manual_whitebalance ?? null}
                schema={sensorControlSchema.shape.manual_whitebalance}
                step={100}
                label="Manual Whitebalance"
                onValueChange={(value) => {
                  onChange("manual_whitebalance", value);
                }}
              />
            </>
          )}

          {/* TODO: Auto focus mode enum, consistent between cameras ? */}

          <BooleanParameter
            value={streamControl?.focus?.auto_focus_trigger ?? false}
            label="Auto Focus Trigger"
            onValueChange={(value) => {
              onChange("focus.auto_focus_trigger", value);
            }}
          />

          <NumericParameter
            value={streamControl?.focus?.lens_position ?? null}
            schema={sensorFocusSchema.shape.lens_position}
            step={0.01}
            label="Lens position"
            onValueChange={(value) => {
              onChange("focus.lens_position", value);
            }}
          />
          </div>
        </div>
      </div>
    </div>
  );
};
