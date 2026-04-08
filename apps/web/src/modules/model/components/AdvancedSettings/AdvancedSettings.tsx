import { Button } from "@/modules/shadcn/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { ModelOutputTypeEnum } from "@repo/schema";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import { HyperparamsModal } from "./HyperparamsModal";

export interface AdvancedSettingsProps {
  outputs: ModelOutputTypeEnum[];
  onOutputsChange: (outputs: ModelOutputTypeEnum[]) => void;
  customHyperparams: string;
  onCustomHyperparamsChange: (value: string) => void;
  hyperparamsError: string | null;
  onHyperparamsErrorChange: (error: string | null) => void;
}

export const AdvancedSettings = ({
  outputs,
  onOutputsChange,
  customHyperparams,
  onCustomHyperparamsChange,
  hyperparamsError,
  onHyperparamsErrorChange,
}: AdvancedSettingsProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleApply = (value: string) => {
    onCustomHyperparamsChange(value);
    onHyperparamsErrorChange(null);
    setModalOpen(false);
  };

  const hasSummary = customHyperparams.trim().length > 0;

  return (
    <>
      <SettingsCard
        stepNumber={5}
        state={customHyperparams.trim() ? "complete" : "pending"}
        title="Advanced Options"
      >
        <div className="flex flex-1 flex-col gap-4">
          <Collapsible>
            <CollapsibleTrigger>Output Formats</CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="flex flex-col gap-2">
                <span className="text-xs">
                  Choose which export formats to generate after training. RAW
                  is the unoptimized ONNX model. RVC2, RVC3, and RVC4 produce
                  hardware-optimized blobs for Luxonis cameras — select the
                  format matching your target device.
                </span>
                <div className="flex flex-row gap-2">
                  {Object.values(ModelOutputTypeEnum).map((outputType) => (
                    <Button
                      key={outputType}
                      variant={
                        outputs.includes(outputType) ? "default" : "outline"
                      }
                      onClick={() => {
                        if (outputs.includes(outputType)) {
                          onOutputsChange(
                            outputs.filter((t) => t !== outputType),
                          );
                        } else {
                          onOutputsChange([...outputs, outputType]);
                        }
                      }}
                    >
                      {outputType}
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsiblePanel>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>
              Custom Training Hyperparameters
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="flex flex-col gap-2">
                {hasSummary && (
                  <div className="max-h-20 overflow-hidden whitespace-pre rounded bg-black/[0.04] p-2 font-mono text-xs text-muted-foreground">
                    {customHyperparams}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setModalOpen(true)}>
                    {hasSummary ? "Edit" : "Configure"}
                  </Button>
                  {hasSummary && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onCustomHyperparamsChange("");
                        onHyperparamsErrorChange(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {hyperparamsError && (
                  <span className="text-xs text-red-500">
                    {hyperparamsError}
                  </span>
                )}
                <span className="text-xs">
                  JSON object that deep-merges with the generated config.
                  Top-level keys: model, loader, trainer, tracker.
                </span>
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </SettingsCard>

      {modalOpen && (
        <HyperparamsModal
          value={customHyperparams}
          onApply={handleApply}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
