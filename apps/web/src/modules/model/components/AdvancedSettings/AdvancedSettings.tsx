import { cn } from "@/lib/utils";
import {
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ModelRegionEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import { HyperparamsModal } from "./HyperparamsModal";

const REGION_LABELS: Record<ModelRegionEnum, string> = {
  [ModelRegionEnum.EUROPE_WEST4]: "europe-west4",
  [ModelRegionEnum.US_CENTRAL1]: "us-central1",
};

const QUANTIZATION_LABELS: Record<ModelQuantizationEnum, string> = {
  [ModelQuantizationEnum.FP16]: "FP16 (default)",
  [ModelQuantizationEnum.INT8]: "INT8",
};

export interface AdvancedSettingsProps {
  trainingType: ProjectTypeEnum;
  outputs: ModelOutputTypeEnum[];
  onOutputsChange: (outputs: ModelOutputTypeEnum[]) => void;
  region: ModelRegionEnum;
  onRegionChange: (region: ModelRegionEnum) => void;
  quantization: ModelQuantizationEnum;
  onQuantizationChange: (quantization: ModelQuantizationEnum) => void;
  customHyperparams: string;
  onCustomHyperparamsChange: (value: string) => void;
  hyperparamsError: string | null;
  onHyperparamsErrorChange: (error: string | null) => void;
}

export const AdvancedSettings = ({
  trainingType,
  outputs,
  onOutputsChange,
  region,
  onRegionChange,
  quantization,
  onQuantizationChange,
  customHyperparams,
  onCustomHyperparamsChange,
  hyperparamsError,
  onHyperparamsErrorChange,
}: AdvancedSettingsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleApply = (value: string) => {
    onCustomHyperparamsChange(value);
    onHyperparamsErrorChange(null);
    setModalOpen(false);
  };

  const hasSummary = customHyperparams.trim().length > 0;

  return (
    <>
      <SettingsCard
        stepNumber={6}
        state={customHyperparams.trim() ? "complete" : "pending"}
        title="Advanced Options"
        collapsible
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
      >
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-5 text-black/90">
              Training Region
            </span>
            <p className="text-sm leading-5 text-black/60">
              europe-west4 keeps the training VM in the same region as your
              dataset and container images, so the job starts quickly.
              us-central1 has better A100 availability and may queue less when
              GPUs are tight, but the first run pulls the dataset and container
              image cross-region and adds a few minutes of startup overhead.
            </p>
            <div className="flex flex-row gap-2 py-2">
              {Object.values(ModelRegionEnum).map((value) => {
                const selected = region === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onRegionChange(value)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-0.5 text-sm leading-5 transition-colors",
                      selected
                        ? "border-emerald-900 bg-emerald-50 text-emerald-700"
                        : "border-transparent bg-white text-black/90 hover:bg-black/5",
                    )}
                  >
                    {REGION_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-5 text-black/90">
              Quantization
            </span>
            <p className="text-sm leading-5 text-black/60">
              FP16 keeps full-precision weights — slower but most accurate. INT8
              quantizes weights and activations to 8 bits, calibrated against a
              random 400-image sample of your training data: typically 2–3×
              faster on RVC4 with a small accuracy drop (≈0.5–2 mAP points).
              Segmentation models use mixed INT8/INT16 automatically to preserve
              mask quality.
            </p>
            <div className="flex flex-row gap-2 py-2">
              {Object.values(ModelQuantizationEnum).map((value) => {
                const selected = quantization === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onQuantizationChange(value)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-0.5 text-sm leading-5 transition-colors",
                      selected
                        ? "border-emerald-900 bg-emerald-50 text-emerald-700"
                        : "border-transparent bg-white text-black/90 hover:bg-black/5",
                    )}
                  >
                    {QUANTIZATION_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-5 text-black/90">
              Output Formats
            </span>
            <p className="text-sm leading-5 text-black/60">
              Choose which export formats to generate after training. RAW is the
              unoptimized ONNX model. RVC2, RVC3, and RVC4 produce
              hardware-optimized blobs for Luxonis cameras — select the format
              matching your target device.
            </p>
            <div className="flex flex-row gap-2 py-2">
              {Object.values(ModelOutputTypeEnum).map((outputType) => {
                const selected = outputs.includes(outputType);
                return (
                  <button
                    key={outputType}
                    type="button"
                    onClick={() =>
                      selected
                        ? onOutputsChange(
                            outputs.filter((t) => t !== outputType),
                          )
                        : onOutputsChange([...outputs, outputType])
                    }
                    className={cn(
                      "cursor-pointer rounded-full border px-2 py-0.5 text-sm leading-5 transition-colors",
                      selected
                        ? "border-emerald-900 bg-emerald-50 text-emerald-700"
                        : "border-transparent bg-white text-black/90 hover:bg-black/5",
                    )}
                  >
                    {outputType}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-row items-center gap-2">
              <span className="text-sm font-medium leading-5 text-black/90">
                Custom Training Hyperparameters
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="cursor-pointer text-sm font-medium leading-5 text-emerald-700 hover:underline"
              >
                {hasSummary ? "Edit" : "Configure"}
              </button>
              {hasSummary && (
                <button
                  type="button"
                  onClick={() => {
                    onCustomHyperparamsChange("");
                    onHyperparamsErrorChange(null);
                  }}
                  className="cursor-pointer text-sm font-medium leading-5 text-black/60 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-sm leading-5 text-black/60">
                JSON object that deep-merges into the Ultralytics training
                config (e.g. model_variant, imgsz, lr0, optimizer).
              </p>
              {hasSummary && (
                <pre className="mt-2 overflow-x-auto whitespace-pre rounded bg-black/[0.04] p-2 font-mono text-xs text-muted-foreground">
                  {customHyperparams}
                </pre>
              )}
            </div>
            {hyperparamsError && (
              <span className="text-xs text-red-500">{hyperparamsError}</span>
            )}
          </div>
        </div>
      </SettingsCard>

      {modalOpen && (
        <HyperparamsModal
          trainingType={trainingType}
          value={customHyperparams}
          onApply={handleApply}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
