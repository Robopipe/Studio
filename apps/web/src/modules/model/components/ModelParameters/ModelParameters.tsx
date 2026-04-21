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

export interface ModelParametersProps {
  model: Model;
}

const ParamItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-0 basis-45 grow flex-col gap-1">
    <span className="text-xs">{label}</span>
    <span className="text-sm font-bold break-words">{value}</span>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-[10px] font-bold uppercase tracking-wider">
      {title}
    </span>
    {children}
  </div>
);

export const ModelParameters = ({ model }: ModelParametersProps) => {
  const [showHyperparams, setShowHyperparams] = useState(false);

  const hasCustomHyperparams =
    model.customHyperparams && Object.keys(model.customHyperparams).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Model Parameters</h2>
      <Section title="Details & model type">
        <div className="flex flex-wrap gap-3">
          <ParamItem label="Version name" value={model.name} />
          <ParamItem label="Epochs" value={String(model.epochs)} />
          <ParamItem label="Training type" value={model.trainingType} />
          <ParamItem
            label="Annotations used"
            value={model.annotationsUsed.join(", ")}
          />
        </div>
      </Section>

      {model.labels.length > 0 && (
        <>
          <Separator />
          <Section title="Labels">
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
          </Section>
        </>
      )}

      <Separator />
      <Section title="Train/Test split">
        <div className="flex flex-wrap gap-3">
          <ParamItem label="Training set" value={`${model.splitTrain}%`} />
          <ParamItem
            label="Validation set"
            value={`${model.splitValidate}%`}
          />
          <ParamItem label="Testing set" value={`${model.splitTest}%`} />
        </div>
      </Section>

      {model.preprocessings.length > 0 && (
        <>
          <Separator />
          <Section title="Preprocessing">
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
          </Section>
        </>
      )}

      {model.augmentations.length > 0 && (
        <>
          <Separator />
          <Section title="Augmentations">
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
          </Section>
        </>
      )}

      <Separator />
      <Section title="Advanced options">
        <div className="flex flex-wrap gap-3">
          <ParamItem
            label="Output Formats"
            value={model.outputTypes.join(", ")}
          />
          {hasCustomHyperparams && (
            <div className="flex min-w-0 basis-45 grow flex-col gap-1">
              <span className="text-xs">Custom Training Hyperparameters</span>
              <button
                type="button"
                className="cursor-pointer self-start border-none bg-none p-0 text-left text-sm font-bold text-emerald-700 underline"
                onClick={() => setShowHyperparams((prev) => !prev)}
              >
                {showHyperparams
                  ? "Hide hyperparameters"
                  : "Show hyperparameters"}
              </button>
            </div>
          )}
        </div>
        {showHyperparams && hasCustomHyperparams && (
          <div className="max-h-75 overflow-x-auto overflow-y-auto rounded-lg bg-black/4 p-3">
            <pre className="font-mono text-xs">
              {JSON.stringify(model.customHyperparams, null, 2)}
            </pre>
          </div>
        )}
      </Section>
    </div>
  );
};
