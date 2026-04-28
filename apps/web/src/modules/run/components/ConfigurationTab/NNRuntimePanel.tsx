import type { NNRuntimeConfig } from "@/core/cameraApi/schemas/nn";
import { Input } from "@/modules/shadcn/ui/input";
import { Slider } from "@/modules/shadcn/ui/slider";
import { Switch } from "@/modules/shadcn/ui/switch";

interface NNRuntimePanelProps {
  value: NNRuntimeConfig;
  onChange: (config: NNRuntimeConfig) => void;
}

const THREADS_MIN = 1;
const THREADS_MAX = 8;
const THROTTLE_MIN = 1;
const THROTTLE_MAX = 60;
const THROTTLE_DEFAULT = 10;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const NNRuntimePanel = ({ value, onChange }: NNRuntimePanelProps) => {
  const throttleEnabled = value.throttle_hz != null;
  const throttleHz = value.throttle_hz ?? THROTTLE_DEFAULT;

  const setThreads = (n: number) => {
    onChange({ ...value, num_inference_threads: n });
  };

  const setThrottleEnabled = (enabled: boolean) => {
    onChange({
      ...value,
      throttle_hz: enabled ? THROTTLE_DEFAULT : null,
    });
  };

  const setThrottleHz = (hz: number) => {
    onChange({ ...value, throttle_hz: hz });
  };

  return (
    <div className="rounded-xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Inference Runtime</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              Inference threads
            </label>
            <Input
              type="number"
              value={value.num_inference_threads}
              min={THREADS_MIN}
              max={THREADS_MAX}
              step={1}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v))
                  setThreads(clamp(v, THREADS_MIN, THREADS_MAX));
              }}
              className="h-8 w-20 text-right text-sm"
            />
          </div>
          <Slider
            value={value.num_inference_threads}
            min={THREADS_MIN}
            max={THREADS_MAX}
            step={1}
            onValueChange={(v) => setThreads(v as number)}
          />
          <p className="text-xs text-muted-foreground">
            Higher pipelines more frames in parallel. RVC4 typically tops out
            around 4. Tune on the device — over-provisioning adds scheduling
            overhead.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm text-muted-foreground">
              Detection rate cap (Hz)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={throttleEnabled ? throttleHz : ""}
                min={THROTTLE_MIN}
                max={THROTTLE_MAX}
                step={1}
                disabled={!throttleEnabled}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v))
                    setThrottleHz(clamp(v, THROTTLE_MIN, THROTTLE_MAX));
                }}
                className="h-8 w-20 text-right text-sm"
              />
              <Switch
                checked={throttleEnabled}
                onCheckedChange={setThrottleEnabled}
                size="sm"
              />
            </div>
          </div>
          <Slider
            value={throttleHz}
            min={THROTTLE_MIN}
            max={THROTTLE_MAX}
            step={1}
            disabled={!throttleEnabled}
            onValueChange={(v) => setThrottleHz(v as number)}
          />
          <p className="text-xs text-muted-foreground">
            Caps the WebSocket detection emit rate. The NN keeps running every
            frame so dashboard counters and threshold transitions stay
            correct; only the network broadcast is throttled.
          </p>
        </div>
      </div>
    </div>
  );
};
