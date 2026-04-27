import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
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

const numberInputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Model</label>
          {trainedModels.length === 0 ? (
            <div className="rounded-md border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-muted-foreground">
              No trained models in this project yet. Train a segmentation
              model first.
            </div>
          ) : (
            <select
              className={numberInputClass}
              value={modelId ?? ""}
              onChange={(e) =>
                setModelId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— select a model —</option>
              {trainedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedModel && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Labels this model was trained on
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedModel.labels.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  (none recorded)
                </span>
              ) : (
                selectedModel.labels.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    {l.name}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" title="Confidence threshold (0-1)">
              Confidence
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className={numberInputClass}
              value={conf}
              onChange={(e) => setConf(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" title="NMS IoU threshold (0-1)">
              IoU
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className={numberInputClass}
              value={iou}
              onChange={(e) => setIou(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              title="Polygon simplification — lower keeps more vertices"
            >
              Polygon ε
            </label>
            <input
              type="number"
              min={0}
              max={0.05}
              step={0.001}
              className={numberInputClass}
              value={polyEpsilon}
              onChange={(e) => setPolyEpsilon(Number(e.target.value))}
            />
          </div>
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
