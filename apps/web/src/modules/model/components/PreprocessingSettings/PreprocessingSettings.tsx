import { useState } from "react";
import { AppliedAugmentation } from "../AugmentationSettings/augmentationTypes";
import { AugmentationChip } from "../AugmentationSettings/AugmentationChip";
import { AugmentationDialog } from "../AugmentationSettings/AugmentationDialog/AugmentationDialog";
import { SettingsCard } from "../SettingsCard";
import {
  getPreprocessingById,
  PREPROCESSING_DEFINITIONS,
} from "./preprocessingTypes";

export interface PreprocessingSettingsProps {
  preprocessings: AppliedAugmentation[];
  onChange: (preprocessings: AppliedAugmentation[]) => void;
}

export const PreprocessingSettings = ({
  preprocessings,
  onChange,
}: PreprocessingSettingsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPp, setEditingPp] = useState<AppliedAugmentation | null>(null);

  const handleRemove = (id: string) => {
    onChange(preprocessings.filter((a) => a.id !== id));
  };

  const handleEdit = (pp: AppliedAugmentation) => {
    setEditingPp(pp);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPp(null);
    setDialogOpen(true);
  };

  const handleDialogApply = (pp: AppliedAugmentation) => {
    if (editingPp) {
      onChange(preprocessings.map((a) => (a.id === editingPp.id ? pp : a)));
    } else {
      onChange([...preprocessings, pp]);
    }
    setDialogOpen(false);
    setEditingPp(null);
  };

  return (
    <>
      <SettingsCard
        state={preprocessings.length > 0 ? "complete" : "pending"}
        stepNumber={4}
        title="Preprocessing"
      >
        <div className="flex w-full flex-row flex-wrap gap-2">
          {preprocessings.map((pp) => {
            const def = getPreprocessingById(pp.type);
            if (!def) return null;
            return (
              <AugmentationChip
                key={pp.id}
                augmentation={pp}
                definition={def}
                onEdit={() => handleEdit(pp)}
                onRemove={() => handleRemove(pp.id)}
              />
            );
          })}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 whitespace-nowrap border-none bg-none px-4 py-3 text-sm font-semibold text-emerald-700 hover:underline"
            onClick={handleAdd}
          >
            + Add
          </button>
        </div>
      </SettingsCard>

      {dialogOpen && (
        <AugmentationDialog
          appliedAugmentations={preprocessings}
          editing={editingPp}
          onClose={() => {
            setDialogOpen(false);
            setEditingPp(null);
          }}
          onApply={handleDialogApply}
          title="Preprocessing"
          categoryTitle="Image Level Preprocessing"
          definitions={PREPROCESSING_DEFINITIONS}
        />
      )}
    </>
  );
};
