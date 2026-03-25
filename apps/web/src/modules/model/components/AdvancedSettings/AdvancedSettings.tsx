import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import { ModelOutputTypeEnum } from "@repo/schema";
import { Button, Stack, Text } from "@repo/ui";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import styles from "./AdvancedSettings.module.scss";
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
        <Stack style={{ flex: 1 }}>
          <Collapsible>
            <CollapsibleTrigger>Output Formats</CollapsibleTrigger>
            <CollapsiblePanel>
              <Stack gap={8}>
                <Text variant="text-12">
                  Choose which export formats to generate after training. RAW is
                  the unoptimized ONNX model. RVC2, RVC3, and RVC4 produce
                  hardware-optimized blobs for Luxonis cameras — select the
                  format matching your target device.
                </Text>
                <Stack direction="row" gap={8}>
                  {Object.values(ModelOutputTypeEnum).map((outputType) => (
                    <Button
                      key={outputType}
                      variant={
                        outputs.includes(outputType) ? "filled" : "outlined"
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
                </Stack>
              </Stack>
            </CollapsiblePanel>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>
              Custom Training Hyperparameters
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <Stack gap={8}>
                {hasSummary && (
                  <div className={styles.hyperparamsSummary}>
                    {customHyperparams}
                  </div>
                )}
                <div className={styles.editRow}>
                  <Button
                    variant="outlined"
                    onClick={() => setModalOpen(true)}
                  >
                    {hasSummary ? "Edit" : "Configure"}
                  </Button>
                  {hasSummary && (
                    <Button
                      variant="outlined"
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
                  <Text
                    variant="text-12"
                    style={{ color: "var(--color-red-500)" }}
                  >
                    {hyperparamsError}
                  </Text>
                )}
                <Text variant="text-12">
                  JSON object that deep-merges with the generated config.
                  Top-level keys: model, loader, trainer, tracker.
                </Text>
              </Stack>
            </CollapsiblePanel>
          </Collapsible>
        </Stack>
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
