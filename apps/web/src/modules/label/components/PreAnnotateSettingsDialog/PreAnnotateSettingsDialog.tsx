import { cn } from "@/lib/utils";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import {
  DetectionPreAnnotateSettings,
  Model,
  ModelBackendEnum,
  ModelStatusEnum,
  PRE_ANNOTATE_DEFAULTS,
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
  ProjectTypeEnum,
  SegmentationPreAnnotateSettings,
} from "@repo/schema";
import { useEffect, useState } from "react";

export interface PreAnnotateSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: Model[];
  segSettings: SegmentationPreAnnotateSettings;
  detSettings: DetectionPreAnnotateSettings;
  segHasSavedSettings: boolean;
  detHasSavedSettings: boolean;
  onApply: (next: PreAnnotateSettings) => Promise<void>;
  onDelete: (modelType: PreAnnotateModelTypeEnum) => Promise<void>;
  isSaving: boolean;
  defaultTab?: PreAnnotateModelTypeEnum;
}

const formatNumber = (value: number, digits: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const SEG_DEFAULTS = PRE_ANNOTATE_DEFAULTS[PreAnnotateModelTypeEnum.SEGMENTATION];
const DET_DEFAULTS = PRE_ANNOTATE_DEFAULTS[PreAnnotateModelTypeEnum.DETECTION];

export const PreAnnotateSettingsDialog = ({
  open,
  onOpenChange,
  models,
  segSettings,
  detSettings,
  segHasSavedSettings,
  detHasSavedSettings,
  onApply,
  onDelete,
  isSaving,
  defaultTab,
}: PreAnnotateSettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState<PreAnnotateModelTypeEnum>(
    defaultTab ?? PreAnnotateModelTypeEnum.SEGMENTATION,
  );

  // Segmentation form state
  const [segModelId, setSegModelId] = useState<number | null>(segSettings.modelId);
  const [segConf, setSegConf] = useState(segSettings.conf);
  const [segIou, setSegIou] = useState(segSettings.iou);
  const [segPolyEpsilon, setSegPolyEpsilon] = useState(segSettings.polyEpsilon);
  const [segMaskThreshold, setSegMaskThreshold] = useState(segSettings.maskThreshold);
  const [segMinAreaPx, setSegMinAreaPx] = useState(segSettings.minAreaPx);
  const [segFillConcavityLabelIds, setSegFillConcavityLabelIds] = useState<number[]>(
    segSettings.fillConcavityLabelIds,
  );

  // Detection form state
  const [detModelId, setDetModelId] = useState<number | null>(detSettings.modelId);
  const [detConf, setDetConf] = useState(detSettings.conf);
  const [detIou, setDetIou] = useState(detSettings.iou);
  const [detMinAreaPx, setDetMinAreaPx] = useState(detSettings.minAreaPx);

  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSegModelId(segSettings.modelId);
    setSegConf(segSettings.conf);
    setSegIou(segSettings.iou);
    setSegPolyEpsilon(segSettings.polyEpsilon);
    setSegMaskThreshold(segSettings.maskThreshold);
    setSegMinAreaPx(segSettings.minAreaPx);
    setSegFillConcavityLabelIds(segSettings.fillConcavityLabelIds);
    setDetModelId(detSettings.modelId);
    setDetConf(detSettings.conf);
    setDetIou(detSettings.iou);
    setDetMinAreaPx(detSettings.minAreaPx);
    setSaveError(null);
    if (defaultTab) setActiveTab(defaultTab);
  }, [open, segSettings, detSettings, defaultTab]);

  const segModels = models.filter(
    (m) =>
      m.status === ModelStatusEnum.DONE &&
      m.trainingType === ProjectTypeEnum.SEGMENTATION &&
      m.backend === ModelBackendEnum.ULTRALYTICS,
  );
  const detModels = models.filter(
    (m) =>
      m.status === ModelStatusEnum.DONE &&
      m.trainingType === ProjectTypeEnum.DETECTION &&
      m.backend === ModelBackendEnum.ULTRALYTICS,
  );
  const hasAnyTrainedModel = models.some(
    (m) => m.status === ModelStatusEnum.DONE && m.backend === ModelBackendEnum.ULTRALYTICS,
  );

  const selectedSegModel = segModels.find((m) => m.id === segModelId) ?? null;

  const toggleFillConcavityLabel = (labelId: number) => {
    setSegFillConcavityLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (activeTab === PreAnnotateModelTypeEnum.SEGMENTATION) {
        const validIds = selectedSegModel
          ? new Set(selectedSegModel.labels.map((l) => l.id))
          : new Set<number>();
        await onApply({
          modelType: PreAnnotateModelTypeEnum.SEGMENTATION,
          modelId: segModelId,
          conf: segConf,
          iou: segIou,
          polyEpsilon: segPolyEpsilon,
          maskThreshold: segMaskThreshold,
          minAreaPx: segMinAreaPx,
          fillConcavityLabelIds: segFillConcavityLabelIds.filter((id) => validIds.has(id)),
        });
      } else {
        await onApply({
          modelType: PreAnnotateModelTypeEnum.DETECTION,
          modelId: detModelId,
          conf: detConf,
          iou: detIou,
          minAreaPx: detMinAreaPx,
        });
      }
      onOpenChange(false);
    } catch {
      setSaveError("Failed to save settings. Please try again.");
    }
  };

  const handleDelete = async () => {
    setSaveError(null);
    try {
      await onDelete(activeTab);
      onOpenChange(false);
    } catch {
      setSaveError("Failed to delete settings. Please try again.");
    }
  };

  const handleReset = () => {
    if (activeTab === PreAnnotateModelTypeEnum.SEGMENTATION) {
      setSegModelId(null);
      setSegConf(SEG_DEFAULTS.conf);
      setSegIou(SEG_DEFAULTS.iou);
      setSegPolyEpsilon(SEG_DEFAULTS.polyEpsilon);
      setSegMaskThreshold(SEG_DEFAULTS.maskThreshold);
      setSegMinAreaPx(SEG_DEFAULTS.minAreaPx);
      setSegFillConcavityLabelIds(SEG_DEFAULTS.fillConcavityLabelIds);
    } else {
      setDetModelId(null);
      setDetConf(DET_DEFAULTS.conf);
      setDetIou(DET_DEFAULTS.iou);
      setDetMinAreaPx(DET_DEFAULTS.minAreaPx);
    }
    setSaveError(null);
  };

  const activeModelId =
    activeTab === PreAnnotateModelTypeEnum.SEGMENTATION ? segModelId : detModelId;
  const activeHasSavedSettings =
    activeTab === PreAnnotateModelTypeEnum.SEGMENTATION
      ? segHasSavedSettings
      : detHasSavedSettings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 sm:max-w-[560px]">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Pre-annotate settings
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as PreAnnotateModelTypeEnum);
            setSaveError(null);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList variant="line" className="shrink-0">
            <TabsTrigger value={PreAnnotateModelTypeEnum.SEGMENTATION}>
              Segmentation
            </TabsTrigger>
            <TabsTrigger value={PreAnnotateModelTypeEnum.DETECTION}>
              Detection
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value={PreAnnotateModelTypeEnum.SEGMENTATION}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-4 pr-1 [scrollbar-color:rgba(0,0,0,0.15)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-black/25 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          >
            <div className="flex flex-col gap-1.5">
              <Label>Model</Label>
              {segModels.length === 0 ? (
                <p className="rounded-md border border-dashed border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-muted-foreground">
                  {hasAnyTrainedModel
                    ? "None of your trained models are Ultra Vision segmentation models. Pre-annotation requires an Ultra Vision segmentation model."
                    : "No trained models in this project yet. Train an Ultra Vision segmentation model first."}
                </p>
              ) : (
                <>
                  <Select
                    value={segModelId == null ? "" : String(segModelId)}
                    onValueChange={(value) =>
                      setSegModelId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model">
                        {(value: string) => {
                          const id = Number(value);
                          const sel = segModels.find((m) => m.id === id);
                          return sel ? sel.name : "Select a model";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {segModels.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pick any trained segmentation model from this project. Each
                    model is downloaded and cached on first use.
                  </p>
                </>
              )}
            </div>

            {selectedSegModel && (
              <div className="flex flex-col gap-1.5">
                <Label>Predicted labels — click to fill concavities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSegModel.labels.length === 0 ? (
                    <span className="text-sm text-muted-foreground">(none recorded)</span>
                  ) : (
                    selectedSegModel.labels.map((l) => {
                      const active = segFillConcavityLabelIds.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleFillConcavityLabel(l.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm transition",
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: l.color }}
                          />
                          {l.name}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected labels get traced as their outer silhouette,
                  bridging dips where the mask cuts inward. Unselected labels
                  stay tight to the predicted mask.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-5">
              <SliderRow
                label="Confidence"
                help="Drop predictions below this score. Lower captures more shapes but lets in more false positives."
                value={segConf}
                min={0}
                max={1}
                step={0.05}
                display={formatNumber(segConf, 2)}
                onChange={setSegConf}
              />
              <SliderRow
                label="IoU"
                help="Suppresses overlapping detections of the same object. Higher keeps more near-duplicates; lower is stricter."
                value={segIou}
                min={0}
                max={1}
                step={0.05}
                display={formatNumber(segIou, 2)}
                onChange={setSegIou}
              />
              <SliderRow
                label="Polygon detail"
                help="Vertex spacing as a fraction of the image diagonal. Lower = more vertices; higher = simpler shapes."
                value={segPolyEpsilon}
                min={0}
                max={0.02}
                step={0.0005}
                display={formatNumber(segPolyEpsilon, 4)}
                onChange={setSegPolyEpsilon}
              />
              <SliderRow
                label="Mask threshold"
                help="Probability cutoff used to turn the model's soft mask into a binary shape. Lower = polygons grow slightly; higher = tighter shapes."
                value={segMaskThreshold}
                min={0.05}
                max={0.95}
                step={0.05}
                display={formatNumber(segMaskThreshold, 2)}
                onChange={setSegMaskThreshold}
              />
              <SliderRow
                label="Minimum polygon area"
                help="Drop predicted polygons whose mask area (in pixels²) is below this. Useful for filtering tiny noise blobs."
                value={segMinAreaPx}
                min={0}
                max={500}
                step={5}
                display={`${Math.round(segMinAreaPx)} px²`}
                onChange={setSegMinAreaPx}
              />
            </div>
          </TabsContent>

          <TabsContent
            value={PreAnnotateModelTypeEnum.DETECTION}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-4 pr-1 [scrollbar-color:rgba(0,0,0,0.15)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-black/25 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          >
            <div className="flex flex-col gap-1.5">
              <Label>Model</Label>
              {detModels.length === 0 ? (
                <p className="rounded-md border border-dashed border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-muted-foreground">
                  {hasAnyTrainedModel
                    ? "None of your trained models are Ultra Vision detection models. Pre-annotation requires an Ultra Vision detection model."
                    : "No trained models in this project yet. Train an Ultra Vision detection model first."}
                </p>
              ) : (
                <>
                  <Select
                    value={detModelId == null ? "" : String(detModelId)}
                    onValueChange={(value) =>
                      setDetModelId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model">
                        {(value: string) => {
                          const id = Number(value);
                          const sel = detModels.find((m) => m.id === id);
                          return sel ? sel.name : "Select a model";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {detModels.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pick any trained detection model from this project. Each
                    model is downloaded and cached on first use.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <SliderRow
                label="Confidence"
                help="Drop detections below this score. Lower captures more boxes but lets in more false positives."
                value={detConf}
                min={0}
                max={1}
                step={0.05}
                display={formatNumber(detConf, 2)}
                onChange={setDetConf}
              />
              <SliderRow
                label="IoU"
                help="Suppresses overlapping detections of the same object. Higher keeps more near-duplicates; lower is stricter."
                value={detIou}
                min={0}
                max={1}
                step={0.05}
                display={formatNumber(detIou, 2)}
                onChange={setDetIou}
              />
              <SliderRow
                label="Minimum box area"
                help="Drop predicted boxes whose area (in pixels²) is below this. Useful for filtering tiny noise detections."
                value={detMinAreaPx}
                min={0}
                max={500}
                step={5}
                display={`${Math.round(detMinAreaPx)} px²`}
                onChange={setDetMinAreaPx}
              />
            </div>
          </TabsContent>
        </Tabs>

        {saveError && <p className="shrink-0 pt-2 text-sm text-destructive">{saveError}</p>}

        <DialogFooter className="shrink-0 pt-6 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            {activeHasSavedSettings && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={activeModelId == null || isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
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
