import { useFieldContext } from "@/core/form/hooks/useFormContext";
import { cn } from "@/lib/utils";
import { Label } from "@/modules/shadcn/ui/label";

type ToggleOption<T extends string> = {
  label: string;
  value: T;
};

type ToggleGroupFieldProps<T extends string> = {
  label?: string;
  options: ToggleOption<T>[];
};

export function ToggleGroupField<T extends string>({
  label,
  options,
}: ToggleGroupFieldProps<T>) {
  const field = useFieldContext<T | null>();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={field.name} className="text-xs text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              field.handleChange(
                field.state.value === option.value ? null : option.value,
              )
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              field.state.value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                field.state.value === option.value
                  ? "bg-primary"
                  : "bg-muted-foreground/40",
              )}
            />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
