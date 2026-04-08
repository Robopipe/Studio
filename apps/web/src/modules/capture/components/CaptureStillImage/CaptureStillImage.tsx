import { Button } from "@/modules/shadcn/ui/button";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { Switch } from "@/modules/shadcn/ui/switch";
import { useState } from "react";
import z from "zod";
import { useCaptureImageFromCamera } from "../../hooks/useCaptureImageFromCamera";
import { CaptureStillImageCountdown } from "../CaptureStillImageCountdown";

const stringToNumber = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: "invalid_type",
      expected: "number",
      message: "Not a number",
    });
    return z.NEVER;
  }
  if (parsed < 1) {
    ctx.addIssue({
      code: "too_small",
      minimum: 1,
      inclusive: true,
      origin: "string",
      message: "Must be greater than 0",
    });
    return z.NEVER;
  }
  return parsed;
});

const stringToFloat = z.string().transform((val, ctx) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: "invalid_type",
      expected: "number",
      message: "Not a number",
    });
    return z.NEVER;
  }
  if (parsed < 0.1) {
    ctx.addIssue({
      code: "too_small",
      minimum: 0.1,
      inclusive: true,
      origin: "string",
      message: "Must be greater than or equal to 0.1",
    });
    return z.NEVER;
  }
  return parsed;
});

const intervalShootingConfigSchema = z.object({
  numberOfImages: stringToNumber,
  intervalSeconds: stringToFloat,
});

type IntervalShootingConfigInput = z.input<typeof intervalShootingConfigSchema>;
export type IntervalShootingConfig = z.output<
  typeof intervalShootingConfigSchema
>;

export interface CaptureStillImageProps {
  selectedCamera: string;
  selectedStream: string;
}

export const CaptureStillImage = ({
  selectedCamera,
  selectedStream,
}: CaptureStillImageProps) => {
  const { handleCaptureImage, isLoading } = useCaptureImageFromCamera();
  const [useIntervalShooting, setUseIntervalShooting] = useState(false);
  const [intervalShootingConfig, setIntervalShootingConfig] =
    useState<IntervalShootingConfigInput>({
      numberOfImages: "",
      intervalSeconds: "",
    });

  const intervalShootingConfigResult = intervalShootingConfigSchema.safeDecode(
    intervalShootingConfig,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap [width:calc(100%-8.25rem)]">
          Use Interval shooting
        </span>

        <Switch
          checked={useIntervalShooting}
          onCheckedChange={(value) => {
            setUseIntervalShooting(value);
          }}
        />
      </div>

      {useIntervalShooting && (
        <>
          <NumberInput
            label="Total"
            placeholder="Total images"
            value={intervalShootingConfig.numberOfImages}
            onChange={(e) => {
              setIntervalShootingConfig({
                ...intervalShootingConfig,
                numberOfImages: e.target.value,
              });
            }}
          />
          <NumberInput
            label="Interval"
            placeholder="Interval"
            suffix="sec"
            value={intervalShootingConfig.intervalSeconds}
            onChange={(e) => {
              setIntervalShootingConfig({
                ...intervalShootingConfig,
                intervalSeconds: e.target.value,
              });
            }}
          />
        </>
      )}

      {useIntervalShooting ? (
        intervalShootingConfigResult.success ? (
          <CaptureStillImageCountdown
            selectedCamera={selectedCamera}
            selectedStream={selectedStream}
            intervalShootingConfig={intervalShootingConfigResult.data}
          />
        ) : null
      ) : (
        <Button
          onClick={() => handleCaptureImage(selectedCamera!, selectedStream!)}
          disabled={!selectedCamera || !selectedStream || isLoading}
          size="lg"
        >
          Capture image
        </Button>
      )}
    </div>
  );
};
