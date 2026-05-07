import type { SahiConfig } from "@/core/cameraApi/schemas/nn";
import { DEFAULT_SAHI_CONFIG } from "@/core/cameraApi/schemas/nn";
import { Input } from "@/modules/shadcn/ui/input";
import { Slider } from "@/modules/shadcn/ui/slider";
import { Switch } from "@/modules/shadcn/ui/switch";

interface SahiConfigPanelProps {
  value: SahiConfig | null;
  onChange: (config: SahiConfig | null) => void;
}

export const SahiConfigPanel = ({ value, onChange }: SahiConfigPanelProps) => {
  const enabled = value !== null;
  const config = value ?? DEFAULT_SAHI_CONFIG;

  const handleToggle = (checked: boolean) => {
    onChange(checked ? DEFAULT_SAHI_CONFIG : null);
  };

  const updateField = (field: keyof SahiConfig, v: number) => {
    onChange({ ...config, [field]: v });
  };

  return (
    <section className="flex flex-col gap-4 border-b px-6 py-5 last:border-b-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          SAHI Configuration
        </h2>
        <Switch checked={enabled} onCheckedChange={handleToggle} size="sm" />
      </div>
      {enabled && (
        <div className="flex flex-col gap-4">
          <SahiField
            label="Slice Width"
            value={config.slice_width}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateField("slice_width", v)}
          />
          <SahiField
            label="Slice Height"
            value={config.slice_height}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateField("slice_height", v)}
          />
          <SahiField
            label="Overlap Ratio"
            value={config.overlap_ratio}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(v) => updateField("overlap_ratio", v)}
          />
          <SahiField
            label="NMS IoU Threshold"
            value={config.nms_iou_threshold}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateField("nms_iou_threshold", v)}
          />
        </div>
      )}
    </section>
  );
};

const SahiField = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <label className="text-sm text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="h-8 w-20 text-right text-sm"
      />
    </div>
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v as number)}
    />
  </div>
);
