import { VerticalIcon } from "@repo/ui";
import { Select } from "@repo/ui/components/Select/Select";
import { HorizontalIcon } from "@repo/ui/icons/HorizontalIcon";
import styles from "./SelectOrientation.module.scss";

export type Orientation = "horizontal" | "vertical";

const items = [
  {
    value: "horizontal",
    label: (
      <span className={styles.selectItem}>
        <HorizontalIcon />
        Horizontal
      </span>
    ),
  },
  {
    value: "vertical",
    label: (
      <span className={styles.selectItem}>
        <VerticalIcon />
        Vertical
      </span>
    ),
  },
];

export interface SelectOrientationProps {
  value?: Orientation | null;
  onSelect: (orientation: Orientation | null) => void;
}

export const SelectOrientation = ({
  value,
  onSelect,
}: SelectOrientationProps) => {
  return (
    <Select<string>
      placeholder="Select orientation"
      items={items}
      value={value}
      onValueChange={(value) => onSelect(value as Orientation)}
    />
  );
};
