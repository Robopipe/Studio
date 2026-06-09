import { ColorPicker } from "@/components/ColorPicker";
import { Label } from "@repo/schema";
import { X } from "lucide-react";
import { CSSProperties } from "react";

export interface LabelChipProps {
  label: Label;
  onRemove?: () => void;
  onColorChange?: (color: string) => void;
}

export const LabelChip = ({
  label,
  onRemove,
  onColorChange,
}: LabelChipProps) => {
  const colorBar = (
    <div
      className={
        onColorChange
          ? "h-6 w-2 shrink-0 cursor-pointer rounded-lg transition-opacity hover:opacity-80"
          : "h-6 w-2 shrink-0 rounded-lg"
      }
      style={{ background: "var(--label-color)" }}
      aria-label={onColorChange ? "Change label color" : undefined}
    />
  );

  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--label-color),transparent_85%)] p-1"
      style={{ "--label-color": label.color } as CSSProperties}
    >
      {onColorChange ? (
        <ColorPicker
          value={label.color}
          onChange={onColorChange}
          trigger={colorBar}
        />
      ) : (
        colorBar
      )}
      <span className="flex-1 px-1 text-xs leading-4 text-foreground/90">
        {label.name}
      </span>
      {onRemove && (
        <X
          onClick={onRemove}
          className="size-4 shrink-0 cursor-pointer text-muted-foreground"
        />
      )}
    </div>
  );
};
