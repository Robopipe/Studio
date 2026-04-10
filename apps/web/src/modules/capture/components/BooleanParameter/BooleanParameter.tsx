import { Switch } from "@/modules/shadcn/ui/switch";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

export interface BooleanParameterProps {
  value: boolean | null;
  label: string;
  onValueChange: (value: boolean) => void;
}

export const BooleanParameter = ({
  value,
  label,
  onValueChange,
}: BooleanParameterProps) => {
  const [internalValue, setInternalValue] = useState(() => value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  if (internalValue === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs leading-4">
      <Info className="size-4 shrink-0 text-foreground/40" />
      <span className="flex-1 truncate text-foreground/90">{label}</span>
      <Switch
        checked={internalValue}
        onCheckedChange={(value) => {
          setInternalValue(value);
          onValueChange(value);
        }}
      />
    </div>
  );
};
