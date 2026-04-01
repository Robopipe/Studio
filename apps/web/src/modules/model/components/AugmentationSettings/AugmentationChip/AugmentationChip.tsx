import { CloseIcon } from "@repo/ui";
import {
  AppliedAugmentation,
  AugmentationDefinition,
  getAugmentationSummary,
} from "../augmentationTypes";
import styles from "./AugmentationChip.module.scss";

export interface AugmentationChipProps {
  augmentation: AppliedAugmentation;
  definition: AugmentationDefinition;
  onEdit: () => void;
  onRemove: () => void;
}

export const AugmentationChip = ({
  augmentation,
  definition,
  onEdit,
  onRemove,
}: AugmentationChipProps) => {
  const summary = getAugmentationSummary(definition, augmentation.params);

  return (
    <div className={styles.augmentationChip}>
      <div className={styles.chipInfo}>
        <div className={styles.chipName}>
          {definition.name}
          {augmentation.duplicateImage && (
            <span className={styles.duplicateBadge}>Duplicate</span>
          )}
        </div>
        {summary && <div className={styles.chipSummary}>{summary}</div>}
      </div>
      <div className={styles.chipActions}>
        <button className={styles.editButton} onClick={onEdit}>
          Edit
        </button>
        <button className={styles.removeButton} onClick={onRemove}>
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
