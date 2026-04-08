import { Label } from "@repo/schema";
import { X } from "lucide-react";

export interface LabelChipProps {
  label: Label;
  onRemove: () => void;
}

export const LabelChip = ({ label, onRemove }: LabelChipProps) => {
  return (
    <div
      className="relative flex items-center p-1"
      style={{ "--chip-color": label.color } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 -z-10 rounded-lg opacity-15"
        style={{ background: "var(--chip-color)" }}
      />
      <div
        className="h-6 w-2 rounded"
        style={{ background: "var(--chip-color)" }}
      />
      <span className="flex-[2] px-2 py-0.5 text-xs">{label.name}</span>
      <X
        onClick={onRemove}
        className="size-4 cursor-pointer text-muted-foreground"
      />
    </div>
  );
};
