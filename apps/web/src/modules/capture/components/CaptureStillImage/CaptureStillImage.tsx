import { Button, NumberInput, Stack, Switch } from "@repo/ui";
import { useState } from "react";
import { useCaptureImageFromCamera } from "../../hooks/useCaptureImageFromCamera";

import z from "zod";
import { CaptureStillImageCountdown } from "../CaptureStillImageCountdown";
import styles from "./CaptureStillImage.module.scss";

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

const intervalShootingConfigSchema = z.object({
  numberOfImages: stringToNumber,
  intervalSeconds: stringToNumber,
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
    <Stack>
      <div className={styles.parameter}>
        <span className={styles.label}>Use Interval shooting</span>

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
    </Stack>
  );
};
