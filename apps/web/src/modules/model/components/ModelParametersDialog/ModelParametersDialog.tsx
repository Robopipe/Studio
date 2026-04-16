import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Separator } from "@/modules/shadcn/ui/separator";
import { Model } from "@repo/schema";
import { useState } from "react";
import {
  getAugmentationById,
  getAugmentationSummary,
} from "../AugmentationSettings/augmentationTypes";
import {
  getPreprocessingById,
  getPreprocessingSummary,
} from "../PreprocessingSettings/preprocessingTypes";

export interface ModelParametersDialogProps {
  model: Model;
  open: boolean;
  onClose: () => void;
}

const ParamItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-0 basis-[180px] grow flex-col gap-1">
    <span className="text-xs">{label}</span>
    <span className="text-sm font-bold break-words">{value}</span>
  </div>
);

export const ModelParametersDialog = ({
  model,
  open,
  onClose,
}: ModelParametersDialogProps) => {
  const [showHyperparams, setShowHyperparams] = useState(false);

  const hasCustomHyperparams =
    model.customHyperparams && Object.keys(model.customHyperparams).length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Model Parameters</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Details &amp; model type
          </span>
          <div className="flex flex-wrap gap-3">
            <ParamItem label="Version name" value={model.name} />
            <ParamItem label="Epochs" value={String(model.epochs)} />
            <ParamItem label="Training type" value={model.trainingType} />
            <ParamItem
              label="Annotations used"
              value={model.annotationsUsed.join(", ")}
            />
          </div>
        </div>

        {model.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Labels
              </span>
              <div className="flex flex-wrap gap-2">
                {model.labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center gap-0 rounded-lg bg-black/[0.08] p-1"
                  >
                    <div
                      className="h-6 w-2 shrink-0 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="px-2 text-xs">{label.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Train/Test split
          </span>
          <div className="flex flex-wrap gap-3">
            <ParamItem label="Training set" value={`${model.splitTrain}%`} />
            <ParamItem
              label="Validation set"
              value={`${model.splitValidate}%`}
            />
            <ParamItem label="Testing set" value={`${model.splitTest}%`} />
          </div>
        </div>

        {model.preprocessings.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Preprocessing
              </span>
              <div className="flex flex-wrap gap-3">
                {model.preprocessings.map((pp) => {
                  const def = getPreprocessingById(pp.type);
                  const summary = def
                    ? getPreprocessingSummary(
                        def,
                        pp.params as Record<string, number | boolean | string>,
                      )
                    : JSON.stringify(pp.params);
                  const label =
                    (def?.name ?? pp.type) +
                    (pp.keepOriginal ? " (Duplicate)" : "");
                  return (
                    <ParamItem key={pp.type} label={label} value={summary} />
                  );
                })}
              </div>
            </div>
          </>
        )}

        {model.augmentations.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Augmentations
              </span>
              <div className="flex flex-wrap gap-3">
                {model.augmentations.map((aug) => {
                  const def = getAugmentationById(aug.type);
                  const summary = def
                    ? getAugmentationSummary(
                        def,
                        aug.params as Record<string, number | boolean | string>,
                      )
                    : JSON.stringify(aug.params);
                  return (
                    <ParamItem
                      key={aug.type}
                      label={def?.name ?? aug.type}
                      value={summary}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Advanced options
          </span>
          <div className="flex flex-wrap gap-3">
            <ParamItem
              label="Output Formats"
              value={model.outputTypes.join(", ")}
            />
            {hasCustomHyperparams && (
              <ParamItem label="Custom Training Hyperparameters" value="" />
            )}
          </div>
          {hasCustomHyperparams && (
            <button
              type="button"
              className="self-start cursor-pointer border-none bg-none p-0 text-left font-inherit text-emerald-700 underline"
              onClick={() => setShowHyperparams((prev) => !prev)}
            >
              <span className="text-sm font-bold">
                {showHyperparams
                  ? "Hide hyperparameters"
                  : "Show hyperparameters"}
              </span>
            </button>
          )}
          {showHyperparams && hasCustomHyperparams && (
            <div className="max-h-[300px] overflow-y-auto overflow-x-auto rounded-lg bg-black/[0.04] p-3">
              <pre className="font-mono text-xs">
                {JSON.stringify(model.customHyperparams, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
