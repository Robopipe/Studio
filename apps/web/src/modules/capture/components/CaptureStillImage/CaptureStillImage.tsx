import { Button } from "@/modules/shadcn/ui/button";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { Switch } from "@/modules/shadcn/ui/switch";
import { useState } from "react";
import z from "zod";
import { useCaptureImageFromCamera } from "../../hooks/useCaptureImageFromCamera";
import { CaptureStillImageCountdown } from "../CaptureStillImageCountdown";

const intervalShootingConfigSchema = z.object({
  numberOfImages: z
    .number({ message: "Not a number" })
    .int("Must be an integer")
    .min(1, "Must be greater than 0"),
  intervalSeconds: z
    .number({ message: "Not a number" })
    .min(0.1, "Must be greater than or equal to 0.1"),
});

type IntervalShootingConfigForm = {
  numberOfImages: number | null;
  intervalSeconds: number | null;
};
export type IntervalShootingConfig = z.output<
  typeof intervalShootingConfigSchema
>;

export interface CaptureStillImageProps {
  selectedCamera: string;
  selectedStream: string | null;
  isStreaming: boolean;
}

export const CaptureStillImage = ({
  selectedCamera,
  selectedStream,
  isStreaming,
}: CaptureStillImageProps) => {
  const { handleCaptureImage, isLoading } = useCaptureImageFromCamera();
  const [useIntervalShooting, setUseIntervalShooting] = useState(false);
  const [intervalShootingConfig, setIntervalShootingConfig] =
    useState<IntervalShootingConfigForm>({
      numberOfImages: null,
      intervalSeconds: null,
    });

  const intervalShootingConfigResult = intervalShootingConfigSchema.safeParse(
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
          disabled={!selectedStream || !isStreaming}
        />
      </div>

      {useIntervalShooting && (
        <>
          <NumberInput
            label="Total"
            placeholder="Total images"
            value={intervalShootingConfig.numberOfImages}
            onValueChange={(v) => {
              setIntervalShootingConfig({
                ...intervalShootingConfig,
                numberOfImages: v,
              });
            }}
          />
          <NumberInput
            decimal
            label="Interval"
            placeholder="Interval"
            suffix="sec"
            value={intervalShootingConfig.intervalSeconds}
            onValueChange={(v) => {
              setIntervalShootingConfig({
                ...intervalShootingConfig,
                intervalSeconds: v,
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
            isStreaming={isStreaming}
            intervalShootingConfig={intervalShootingConfigResult.data}
          />
        ) : null
      ) : (
        <Button
          onClick={() => handleCaptureImage(selectedCamera!, selectedStream!)}
          disabled={!selectedCamera || !selectedStream || !isStreaming || isLoading}
          size="lg"
        >
          Capture image
        </Button>
      )}
    </div>
  );
};
