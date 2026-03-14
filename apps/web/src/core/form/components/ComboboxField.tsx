import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/modules/shadcn/ui/combobox";
import { useFieldContext } from "../hooks/useFormContext";
import { FieldWrapper } from "./FieldWrapper";

export type ComboboxOption = { label: string; value: string };

export type ComboboxFieldProps = {
  label?: string;
  error?: string;
  placeholder?: string;
  options: ComboboxOption[];
  parseValue?: (v: string) => unknown;
  formatValue?: (v: unknown) => string;
  deselectable?: boolean;
};

export const ComboboxField = ({
  label,
  error,
  placeholder,
  options,
  parseValue,
  formatValue,
  deselectable,
}: ComboboxFieldProps) => {
  const field = useFieldContext();

  const currentValueStr = formatValue
    ? formatValue(field.state.value)
    : String(field.state.value ?? "");

  const selectedOption = options.find((o) => o.value === currentValueStr) ?? null;

  return (
    <FieldWrapper
      label={label}
      name={field.name}
      error={error ?? field.state.meta.errors?.[0]?.message}
    >
      <Combobox
        value={selectedOption}
        onValueChange={(option) => {
          if (option === null) {
            field.handleChange(null);
          } else {
            field.handleChange(parseValue ? parseValue(option.value) : option.value);
          }
        }}
        isItemEqualToValue={(item, val) => item.value === val.value}
      >
        <ComboboxInput
          id={field.name}
          placeholder={placeholder}
          showClear={deselectable}
          aria-invalid={!!field.state.meta.errors?.[0]}
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxList>
            {options.map((o) => (
              <ComboboxItem key={o.value} value={o}>
                {o.label}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>No results found</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FieldWrapper>
  );
};
