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
    <div className="flex items-center gap-2">
      <Info className="size-4 text-black/[0.38]" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap [width:calc(100%-8.25rem)]">
        {label}
      </span>

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
