import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useFieldContext } from "../hooks/useFormContext";
import { FieldWrapper } from "./FieldWrapper";

export type SelectOption = { label: string; value: string };

export type SelectInputFieldProps = {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  parseValue?: (v: string) => unknown;
  formatValue?: (v: unknown) => string;
  deselectable?: boolean;
};

export const SelectInputField = ({
  label,
  error,
  placeholder,
  options,
  parseValue,
  formatValue,
  deselectable,
}: SelectInputFieldProps) => {
  const field = useFieldContext();

  const currentValue = formatValue
    ? formatValue(field.state.value)
    : String(field.state.value ?? "");

  const selectedLabel = options.find((o) => o.value === currentValue)?.label;

  return (
    <FieldWrapper
      label={label}
      name={field.name}
      error={error ?? field.state.meta.errors?.[0]?.message}
    >
      <Select
        value={currentValue}
        onValueChange={(v) => {
          if (v === null) return;
          field.handleChange(parseValue ? parseValue(v) : v);
        }}
      >
        <SelectTrigger
          id={field.name}
          className="w-full"
          aria-invalid={!!field.state.meta.errors?.[0]}
        >
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {deselectable && (
            <SelectItem value="">
              <span className="text-muted-foreground">None</span>
            </SelectItem>
          )}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};
