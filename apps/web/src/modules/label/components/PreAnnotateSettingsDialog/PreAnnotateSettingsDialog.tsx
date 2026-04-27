import { Badge } from "@/modules/shadcn/ui/badge";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Slider } from "@/modules/shadcn/ui/slider";
import { Model, ModelStatusEnum } from "@repo/schema";
import { useEffect, useState } from "react";
import {
  DEFAULT_PRE_ANNOTATE_SETTINGS,
  PreAnnotateSettings,
} from "../../utils/preAnnotateSettings";

export interface PreAnnotateSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: Model[];
  settings: PreAnnotateSettings;
  onApply: (next: PreAnnotateSettings) => void;
}

const formatNumber = (value: number, digits: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const PreAnnotateSettingsDialog = ({
  open,
  onOpenChange,
  models,
  settings,
  onApply,
}: PreAnnotateSettingsDialogProps) => {
  const trainedModels = models.filter((m) => m.status === ModelStatusEnum.DONE);

  const [modelId, setModelId] = useState<number | null>(settings.modelId);
  const [conf, setConf] = useState(settings.conf);
  const [iou, setIou] = useState(settings.iou);
  const [polyEpsilon, setPolyEpsilon] = useState(settings.polyEpsilon);

  useEffect(() => {
    if (!open) return;
    setModelId(settings.modelId);
    setConf(settings.conf);
    setIou(settings.iou);
    setPolyEpsilon(settings.polyEpsilon);
  }, [open, settings]);

  const selectedModel = trainedModels.find((m) => m.id === modelId) ?? null;

  const handleSave = () => {
    onApply({ modelId, conf, iou, polyEpsilon });
    onOpenChange(false);
  };

  const handleReset = () => {
    setModelId(null);
    setConf(DEFAULT_PRE_ANNOTATE_SETTINGS.conf);
    setIou(DEFAULT_PRE_ANNOTATE_SETTINGS.iou);
    setPolyEpsilon(DEFAULT_PRE_ANNOTATE_SETTINGS.polyEpsilon);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Pre-annotate settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Model</Label>
          {trainedModels.length === 0 ? (
            <p className="rounded-md border border-dashed border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-muted-foreground">
              No trained models in this project yet. Train a segmentation model
              first.
            </p>
          ) : (
            <>
              <Select
                value={modelId == null ? "" : String(modelId)}
                onValueChange={(value) =>
                  setModelId(value ? Number(value) : null)
                }
              >
                <SelectTrigger>
                  {/* Base UI's SelectValue renders the raw `value` unless
                      we pass a render function. Map id → human name. */}
                  <SelectValue placeholder="Select a model">
                    {(value: string) => {
                      const id = Number(value);
                      const sel = trainedModels.find((m) => m.id === id);
                      return sel ? sel.name : "Select a model";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {trainedModels.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pick any trained segmentation model from this project. Each
                model is downloaded and cached on first use, so re-using the
                same one across tasks is fastest.
              </p>
            </>
          )}
        </div>

        {selectedModel && (
          <div className="flex flex-col gap-1.5">
            <Label>Predicted labels</Label>
            <div className="flex flex-wrap gap-1.5">
              {selectedModel.labels.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  (none recorded)
                </span>
              ) : (
                selectedModel.labels.map((l) => (
                  <Badge
                    key={l.id}
                    variant="outline"
                    className="gap-1.5 px-2 py-0.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    {l.name}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The labels this model was trained on. Predicted polygons are
              attached to these labels in the same order.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <SliderRow
            label="Confidence"
            help="Drop predictions below this score. Lower captures more shapes but lets in more false positives."
            value={conf}
            min={0}
            max={1}
            step={0.05}
            display={formatNumber(conf, 2)}
            onChange={setConf}
          />
          <SliderRow
            label="IoU"
            help="Suppresses overlapping detections of the same object. Higher keeps more near-duplicates; lower is stricter."
            value={iou}
            min={0}
            max={1}
            step={0.05}
            display={formatNumber(iou, 2)}
            onChange={setIou}
          />
          <SliderRow
            label="Polygon detail"
            help="How tightly each polygon follows the model's mask. Lower = more vertices and smoother curves; higher = simpler shapes."
            value={polyEpsilon}
            min={0}
            max={0.02}
            step={0.0005}
            display={formatNumber(polyEpsilon, 4)}
            onChange={setPolyEpsilon}
          />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={modelId == null}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SliderRowProps {
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (next: number) => void;
}

const SliderRow = ({
  label,
  help,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderRowProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <Label>{label}</Label>
      <span className="font-mono text-sm tabular-nums">{display}</span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => {
        const v = Array.isArray(next) ? next[0] : next;
        if (typeof v === "number") onChange(v);
      }}
    />
    <p className="text-xs text-muted-foreground">{help}</p>
  </div>
);
