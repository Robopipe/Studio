import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Separator } from "@/modules/shadcn/ui/separator";
import { Model } from "@repo/schema";
import { Text } from "@repo/ui";
import { useState } from "react";
import {
  getAugmentationById,
  getAugmentationSummary,
} from "../AugmentationSettings/augmentationTypes";
import {
  getPreprocessingById,
  getPreprocessingSummary,
} from "../PreprocessingSettings/preprocessingTypes";
import styles from "./ModelParametersDialog.module.scss";

export interface ModelParametersDialogProps {
  model: Model;
  open: boolean;
  onClose: () => void;
}

const ParamItem = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.paramItem}>
    <Text variant="text-12" color="text-primary">
      {label}
    </Text>
    <Text variant="text-14" weight="700">
      {value}
    </Text>
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

        <div className={styles.section}>
          <Text variant="text-10" weight="700" className={styles.sectionTitle}>
            Details & model type
          </Text>
          <div className={styles.paramsGrid}>
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
            <div className={styles.section}>
              <Text
                variant="text-10"
                weight="700"
                className={styles.sectionTitle}
              >
                Labels
              </Text>
              <div className={styles.labelsRow}>
                {model.labels.map((label) => (
                  <div key={label.id} className={styles.labelChip}>
                    <div
                      className={styles.labelColor}
                      style={{ backgroundColor: label.color }}
                    />
                    <Text variant="text-12" className={styles.labelName}>
                      {label.name}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className={styles.section}>
          <Text variant="text-10" weight="700" className={styles.sectionTitle}>
            Train/Test split
          </Text>
          <div className={styles.paramsGrid}>
            <ParamItem
              label="Training set"
              value={`${model.splitTrain}%`}
            />
            <ParamItem
              label="Validation set"
              value={`${model.splitValidate}%`}
            />
            <ParamItem
              label="Testing set"
              value={`${model.splitTest}%`}
            />
          </div>
        </div>

        {model.preprocessings.length > 0 && (
          <>
            <Separator />
            <div className={styles.section}>
              <Text
                variant="text-10"
                weight="700"
                className={styles.sectionTitle}
              >
                Preprocessing
              </Text>
              <div className={styles.paramsGrid}>
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
                    <ParamItem
                      key={pp.type}
                      label={label}
                      value={summary}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        {model.augmentations.length > 0 && (
          <>
            <Separator />
            <div className={styles.section}>
              <Text
                variant="text-10"
                weight="700"
                className={styles.sectionTitle}
              >
                Augmentations
              </Text>
              <div className={styles.paramsGrid}>
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
        <div className={styles.section}>
          <Text variant="text-10" weight="700" className={styles.sectionTitle}>
            Advanced options
          </Text>
          <div className={styles.paramsGrid}>
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
              className={styles.hyperparamsToggle}
              onClick={() => setShowHyperparams((prev) => !prev)}
            >
              <Text variant="text-14" weight="700">
                {showHyperparams ? "Hide hyperparameters" : "Show hyperparameters"}
              </Text>
            </button>
          )}
          {showHyperparams && hasCustomHyperparams && (
            <div className={styles.hyperparamsJson}>
              <pre>
                <Text variant="code-12">
                  {JSON.stringify(model.customHyperparams, null, 2)}
                </Text>
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
