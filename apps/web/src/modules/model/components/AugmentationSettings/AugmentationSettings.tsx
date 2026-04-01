import { Stack } from "@repo/ui";
import { useState } from "react";
import { SettingsCard } from "../SettingsCard";
import { AugmentationChip } from "./AugmentationChip";
import { AugmentationDialog } from "./AugmentationDialog";
import styles from "./AugmentationSettings.module.scss";
import { AppliedAugmentation, getAugmentationById } from "./augmentationTypes";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AugmentationSettingsProps {
  augmentations: AppliedAugmentation[];
  onChange: (augmentations: AppliedAugmentation[]) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AugmentationSettings = ({
  augmentations,
  onChange,
}: AugmentationSettingsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAug, setEditingAug] = useState<AppliedAugmentation | null>(
    null,
  );

  const handleRemove = (id: string) => {
    onChange(augmentations.filter((a) => a.id !== id));
  };

  const handleEdit = (aug: AppliedAugmentation) => {
    setEditingAug(aug);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAug(null);
    setDialogOpen(true);
  };

  const handleDialogApply = (aug: AppliedAugmentation) => {
    if (editingAug) {
      onChange(augmentations.map((a) => (a.id === editingAug.id ? aug : a)));
    } else {
      onChange([...augmentations, aug]);
    }
    setDialogOpen(false);
    setEditingAug(null);
  };

  return (
    <>
      <SettingsCard
        state={augmentations.length > 0 ? "complete" : "pending"}
        stepNumber={5}
        title="Augmentation"
      >
        <Stack direction="row" gap={8} className={styles.augmentationSettings}>
          {augmentations.map((aug) => {
            const def = getAugmentationById(aug.type);
            if (!def) return null;
            return (
              <AugmentationChip
                key={aug.id}
                augmentation={aug}
                definition={def}
                onEdit={() => handleEdit(aug)}
                onRemove={() => handleRemove(aug.id)}
              />
            );
          })}
          <button className={styles.addButton} onClick={handleAdd}>
            + Add
          </button>
        </Stack>
      </SettingsCard>

      {dialogOpen && (
        <AugmentationDialog
          appliedAugmentations={augmentations}
          editing={editingAug}
          onClose={() => {
            setDialogOpen(false);
            setEditingAug(null);
          }}
          onApply={handleDialogApply}
        />
      )}
    </>
  );
};

// ─── Dialog ──────────────────────────────────────────────────────────────────
