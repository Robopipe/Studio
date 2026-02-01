import { Label } from "@repo/schema";

import { CloseIcon, Text } from "@repo/ui";
import styles from "./LabelChip.module.scss";

export interface LabelChipProps {
  label: Label;
  onRemove: () => void;
}

// TODO: colors to hex

export const LabelChip = ({ label, onRemove }: LabelChipProps) => {
  return (
    <div
      className={styles.labelChip}
      style={{ "--color": label.color } as React.CSSProperties}
    >
      <div className={styles.backgroundColor} />
      <div className={styles.mainColor} />
      <Text variant="text-12" weight="400" className={styles.labelName}>
        {label.name}
      </Text>
      <CloseIcon onClick={onRemove} className={styles.closeIcon} />
    </div>
  );
};
