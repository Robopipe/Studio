import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Info } from "lucide-react";

export interface SelectParameterProps {
  value: string | null;
  options: string[];
  label: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

const formatOption = (option: string) =>
  option
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");

export const SelectParameter = ({
  value,
  options,
  label,
  disabled,
  onValueChange,
}: SelectParameterProps) => {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs leading-4">
      <Info className="size-4 shrink-0 text-foreground/40" />
      <span className="flex-1 truncate text-foreground/90">{label}</span>
      <Select
        value={value ?? undefined}
        disabled={disabled}
        onValueChange={(next) => {
          if (typeof next === "string") {
            onValueChange(next);
          }
        }}
      >
        <SelectTrigger size="sm" className="h-8 min-w-40 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {formatOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
