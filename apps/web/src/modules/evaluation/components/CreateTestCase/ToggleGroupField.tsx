import { cn } from "@/lib/utils";

type ToggleOption<T extends string> = {
  label: string;
  value: T;
};

type ToggleGroupFieldProps<T extends string> = {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ToggleGroupField<T extends string>({
  options,
  value,
  onChange,
}: ToggleGroupFieldProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            value === option.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              value === option.value ? "bg-primary" : "bg-muted-foreground/40",
            )}
          />
          {option.label}
        </button>
      ))}
    </div>
  );
}
