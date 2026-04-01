import { Button, CloseIcon, Switch, Text } from "@repo/ui";
import { useCallback, useState } from "react";
import {
  AppliedAugmentation,
  AugmentationDefinition,
  getDefaultValues,
  IMAGE_AUGMENTATIONS,
} from "../augmentationTypes";
import styles from "./AugmentationDialog.module.scss";

export interface AugmentationDialogProps {
  appliedAugmentations: AppliedAugmentation[];
  editing: AppliedAugmentation | null;
  onClose: () => void;
  onApply: (aug: AppliedAugmentation) => void;
  title?: string;
  categoryTitle?: string;
  definitions?: AugmentationDefinition[];
}

export const AugmentationDialog = ({
  appliedAugmentations,
  editing,
  onClose,
  onApply,
  title = "Augmentation",
  categoryTitle = "Image Level Augmentations",
  definitions = IMAGE_AUGMENTATIONS,
}: AugmentationDialogProps) => {
  const [selectedDef, setSelectedDef] = useState<AugmentationDefinition | null>(
    editing ? (definitions.find((d) => d.id === editing.type) ?? null) : null,
  );
  const [paramValues, setParamValues] = useState<
    Record<string, number | boolean | string>
  >(editing?.params ?? {});

  const appliedIds = new Set(appliedAugmentations.map((a) => a.type));

  const handleSelectAugmentation = useCallback(
    (def: AugmentationDefinition) => {
      // Don't allow selecting already-applied augmentations (unless editing that one)
      if (appliedIds.has(def.id) && editing?.type !== def.id) return;
      setSelectedDef(def);
      if (editing?.type === def.id) {
        setParamValues(editing.params);
      } else {
        setParamValues(getDefaultValues(def));
      }
    },
    [appliedIds, editing],
  );

  const handleParamChange = (key: string, value: number | boolean | string) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (!selectedDef) return;
    onApply({
      id: editing?.id ?? `${selectedDef.id}_${Date.now()}`,
      type: selectedDef.id,
      params: paramValues,
    });
  };

  return (
    <>
      <div className={styles.dialogBackdrop} onClick={onClose} />
      <div className={styles.dialogPopup}>
        {/* Header */}
        <div className={styles.dialogHeader}>
          <Text weight="600" variant="text-16">
            {title}
          </Text>
          <button className={styles.dialogClose} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.dialogBody}>
          {/* Left: augmentation grid */}
          <div className={styles.dialogLeft}>
            <Text className={styles.categoryTitle}>
              {categoryTitle}
            </Text>
            <div className={styles.augGrid}>
              {definitions.map((def) => {
                const isSelected = selectedDef?.id === def.id;
                const isApplied =
                  appliedIds.has(def.id) && editing?.type !== def.id;
                return (
                  <button
                    key={def.id}
                    className={`${styles.augTile} ${isSelected ? styles.augTileSelected : ""} ${isApplied ? styles.augTileAlreadyApplied : ""}`}
                    onClick={() => handleSelectAugmentation(def)}
                    title={isApplied ? "Already applied" : def.name}
                  >
                    {def.image}
                    <Text
                      className={styles.augTileName}
                      color="text-primary"
                      variant="text-14"
                    >
                      {def.name}
                    </Text>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: details + params */}
          <div className={styles.dialogRight}>
            {selectedDef ? (
              <>
                <div className={styles.detailTitle}>{selectedDef.name}</div>
                <div className={styles.detailDescription}>
                  {selectedDef.description}
                </div>

                {selectedDef.params.length > 0 && (
                  <div className={styles.paramForm}>
                    {selectedDef.params.map((param) => (
                      <div key={param.key} className={styles.paramRow}>
                        {param.type === "boolean" ? (
                          <div className={styles.switchRow}>
                            <Text variant="text-14" weight="500">
                              {param.label}
                            </Text>
                            <Switch
                              checked={paramValues[param.key] as boolean}
                              onCheckedChange={(checked) =>
                                handleParamChange(param.key, checked)
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <label className={styles.paramLabel}>
                              {param.label}
                              {param.unit ? ` (${param.unit})` : ""}
                            </label>
                            <input
                              type="number"
                              className={styles.paramInput}
                              value={paramValues[param.key] as number}
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              onChange={(e) =>
                                handleParamChange(
                                  param.key,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noSelection}>
                Select an augmentation to configure
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <Button variant="outlined" onClick={onClose}>
            Go Back
          </Button>
          <Button onClick={handleApply} disabled={!selectedDef}>
            Apply
          </Button>
        </div>
      </div>
    </>
  );
};
