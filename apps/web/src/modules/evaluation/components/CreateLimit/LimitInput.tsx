import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";

type LimitInputProps = {
  label?: string;
  value: number | null;
  unit: string;
  onChange: (v: number | null) => void;
};

export function LimitInput({ label, value, unit, onChange }: LimitInputProps) {
  return (
    <div className="flex w-27 flex-col gap-2">
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <div className="relative">
        <Input
          type="number"
          className="pr-8"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}
