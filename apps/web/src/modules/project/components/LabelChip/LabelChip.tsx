import { ColorPicker } from "@/components/ColorPicker";
import { Label } from "@repo/schema";
import { X } from "lucide-react";

export interface LabelChipProps {
  label: Label;
  onRemove: () => void;
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
          ? "h-6 w-2 cursor-pointer rounded transition-opacity hover:opacity-80"
          : "h-6 w-2 rounded"
      }
      style={{ background: "var(--chip-color)" }}
      aria-label={onColorChange ? "Change label color" : undefined}
    />
  );

  return (
    <div
      className="relative flex items-center p-1"
      style={{ "--chip-color": label.color } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 -z-10 rounded-lg opacity-15"
        style={{ background: "var(--chip-color)" }}
      />
      {onColorChange ? (
        <ColorPicker
          value={label.color}
          onChange={onColorChange}
          trigger={colorBar}
        />
      ) : (
        colorBar
      )}
      <span className="flex-2 px-2 py-0.5 text-xs">{label.name}</span>
      <X
        onClick={onRemove}
        className="size-4 cursor-pointer text-muted-foreground"
      />
    </div>
  );
};
