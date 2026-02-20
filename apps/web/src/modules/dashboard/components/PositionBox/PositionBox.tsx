import { DashboardConfigurationItemPositionEnum } from "@repo/schema";
import clsx from "clsx";

import styles from "./PositionBox.module.scss";

interface PositionBoxProps {
  value: DashboardConfigurationItemPositionEnum;
  onChange: (value: DashboardConfigurationItemPositionEnum) => void;
}

const { POS_LEFT, POS_RIGHT, POS_TOP, POS_BOTTOM, POS_CENTER } =
  DashboardConfigurationItemPositionEnum;

/**
 * Interactive position selector box.
 * Shows an outer rectangle (parent boundary) and an inner rectangle (target)
 * that moves to reflect the selected position. Users click on the regions
 * of the box to pick left / right / top / bottom / center.
 */
export const PositionBox = ({ value, onChange }: PositionBoxProps) => {
  return (
    <div className={styles.box} title="Click a region to set position">
      {/* Outer boundary */}
      <div className={styles.outer}>
        {/* Clickable regions */}
        <button
          className={clsx(styles.region, styles.left, value === POS_LEFT && styles.active)}
          onClick={() => onChange(POS_LEFT)}
          aria-label="Position left"
        />
        <button
          className={clsx(styles.region, styles.right, value === POS_RIGHT && styles.active)}
          onClick={() => onChange(POS_RIGHT)}
          aria-label="Position right"
        />
        <button
          className={clsx(styles.region, styles.top, value === POS_TOP && styles.active)}
          onClick={() => onChange(POS_TOP)}
          aria-label="Position top"
        />
        <button
          className={clsx(styles.region, styles.bottom, value === POS_BOTTOM && styles.active)}
          onClick={() => onChange(POS_BOTTOM)}
          aria-label="Position bottom"
        />
        <button
          className={clsx(styles.region, styles.center, value === POS_CENTER && styles.active)}
          onClick={() => onChange(POS_CENTER)}
          aria-label="Position center"
        />

        {/* Inner rectangle indicator */}
        <div className={clsx(styles.inner, styles[positionClass(value)])} />
      </div>
    </div>
  );
};

function positionClass(pos: DashboardConfigurationItemPositionEnum): string {
  switch (pos) {
    case POS_LEFT:
      return "posLeft";
    case POS_RIGHT:
      return "posRight";
    case POS_TOP:
      return "posTop";
    case POS_BOTTOM:
      return "posBottom";
    default:
      return "posCenter";
  }
}
