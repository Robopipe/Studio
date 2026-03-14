import { ComponentProps, useEffect, useState } from "react";

import { Input } from "@/modules/shadcn/ui/input";
import { useFieldContext } from "../hooks/useFormContext";
import { FieldWrapper } from "./FieldWrapper";

export type NumberInputFieldProps = Omit<
  ComponentProps<typeof Input>,
  "type"
> & {
  label?: string;
  error?: string;
  unit?: string;
};

export const NumberInputField = ({
  label,
  error,
  unit,
  ...props
}: NumberInputFieldProps) => {
  const field = useFieldContext<number | null | undefined>();
  const [shownValue, setShownValue] = useState<string>("");

  const handleChange = (text: string) => {
    let value = text;

    // Allow only numbers, commas, and periods
    value = value.replace(/[^0-9.,]/g, "");

    // Now we want to update the shown value
    // It is possible that number is in progress of being typed, so we keep it as is
    setShownValue(value);

    if (value === "") {
      field.handleChange(null);
      return;
    }

    // Transform commas to periods for standard decimal representation
    const transformedValue = value.replace(/,/g, ".");
    if (transformedValue === ".") {
      return;
    }

    // Convert to number and update the form value
    const valueAsNumber = Number(transformedValue);

    // In case of invalid number, reset the form value to null
    if (typeof valueAsNumber !== "number" || isNaN(valueAsNumber)) {
      setShownValue("");
      field.handleChange(null);
      return;
    }

    field.handleChange(valueAsNumber);
  };

  useEffect(() => {
    if (field.state.value === undefined || field.state.value === null) {
      setShownValue("");
    } else {
      setShownValue(field.state.value.toString());
    }
  }, [field.state.value]);

  return (
    <FieldWrapper
      label={label}
      name={field.name}
      error={error ?? field.state.meta.errors?.[0]?.message}
    >
      {unit ? (
        <div className="relative">
          <Input
            id={field.name}
            className="pr-8"
            value={shownValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={field.handleBlur}
            inputMode="decimal"
            aria-invalid={!!field.state.meta.errors?.[0]}
            {...props}
          />
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {unit}
          </span>
        </div>
      ) : (
        <Input
          id={field.name}
          value={shownValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={field.handleBlur}
          inputMode="decimal"
          aria-invalid={!!field.state.meta.errors?.[0]}
          {...props}
        />
      )}
    </FieldWrapper>
  );
};
