import { ComponentProps } from "react";

import { Input } from "@/modules/shadcn/ui/input";
import { useFieldContext } from "../hooks/useFormContext";
import { FieldWrapper } from "./FieldWrapper";

export type TextInputFieldProps = ComponentProps<typeof Input> & {
  label?: string;
  error?: string;
};

export const TextInputField = ({
  label,
  error,
  ...props
}: TextInputFieldProps) => {
  const field = useFieldContext<string | null | undefined>();

  return (
    <FieldWrapper
      label={label}
      name={field.name}
      error={error ?? field.state.meta.errors?.[0]?.message}
    >
      <Input
        id={field.name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={!!field.state.meta.errors?.[0]}
        {...props}
      />
    </FieldWrapper>
  );
};
