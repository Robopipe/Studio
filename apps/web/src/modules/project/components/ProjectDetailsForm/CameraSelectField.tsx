import type { DeviceInfo } from "@/core/cameraApi/schemas";
import { Button } from "@/modules/shadcn/ui/button";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Camera } from "lucide-react";
import { useMemo } from "react";

interface CameraSelectFieldProps {
  cameras: DeviceInfo[] | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  /** False when neither URL field holds a valid URL. */
  hasUrl: boolean;
  value: string | null;
  onChange: (mxid: string | null) => void;
}

export const CameraSelectField = ({
  cameras,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasUrl,
  value,
  onChange,
}: CameraSelectFieldProps) => {
  // The stored camera may be absent from the detected list (unplugged, other
  // API). Keep it selectable-as-is in the trigger instead of clearing it.
  const valueNotDetected =
    value != null && cameras != null && !cameras.some((c) => c.mxid === value);

  const items = useMemo(() => {
    const record: Record<string, string> = {};
    for (const camera of cameras ?? []) {
      record[camera.mxid] = camera.camera_name;
    }
    if (value && !(value in record)) {
      record[value] = cameras != null ? `${value} (not detected)` : value;
    }
    return record;
  }, [cameras, value]);

  const noCamerasDetected = cameras != null && cameras.length === 0;
  const disabled = isLoading || isError || !hasUrl || (noCamerasDetected && !value);

  const placeholder = !hasUrl
    ? "No camera API URL entered"
    : noCamerasDetected
      ? "No cameras detected"
      : "Select camera";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="projectCamera" className="font-semibold">
        Camera (stored locally)
      </Label>
      <div className="flex flex-row items-center gap-2">
        <Select
          value={value}
          onValueChange={(val) => onChange(val)}
          items={items}
          disabled={disabled}
        >
          <SelectTrigger id="projectCamera" className="w-full flex-1">
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="size-4" />
                Detecting cameras…
              </span>
            ) : (
              <SelectValue placeholder={placeholder}>
                {(mxid: string) => (
                  <span className="flex items-center gap-2">
                    <Camera className="size-4" />
                    {items[mxid] ?? mxid}
                  </span>
                )}
              </SelectValue>
            )}
          </SelectTrigger>
          <SelectContent>
            {cameras?.map((camera) => (
              <SelectItem key={camera.mxid} value={camera.mxid}>
                <span className="flex items-center gap-2">
                  <Camera className="size-4" />
                  {camera.camera_name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(isError || noCamerasDetected) && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
      {isError && (
        <p className="text-xs text-destructive">
          {errorMessage ?? "Couldn't reach the camera API at this URL."}
        </p>
      )}
      {valueNotDetected && !isLoading && !isError && (
        <p className="text-xs text-amber-600">
          The previously selected camera wasn't detected at this URL.
        </p>
      )}
      <p className="text-xs text-black/50">
        Applies only to you on this browser. Used by the Capture and Run pages.
        {!hasUrl && " Enter a Camera API URL to detect cameras."}
      </p>
    </div>
  );
};
