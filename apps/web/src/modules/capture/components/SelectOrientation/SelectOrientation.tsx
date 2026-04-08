import { HorizontalIcon, VerticalIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";

export type Orientation = "horizontal" | "vertical";

export interface SelectOrientationProps {
  value?: Orientation | null;
  onSelect: (orientation: Orientation | null) => void;
}

export const SelectOrientation = ({
  value,
  onSelect,
}: SelectOrientationProps) => {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(val) => onSelect(val as Orientation)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select orientation" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="horizontal">
          <span className="flex items-center gap-2">
            <HorizontalIcon className="size-4" />
            Horizontal
          </span>
        </SelectItem>
        <SelectItem value="vertical">
          <span className="flex items-center gap-2">
            <VerticalIcon className="size-4" />
            Vertical
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
