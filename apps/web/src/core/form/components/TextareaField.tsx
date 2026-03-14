import { ComponentProps } from "react";

import { Textarea } from "@/modules/shadcn/ui/textarea";
import { useFieldContext } from "../hooks/useFormContext";
import { FieldWrapper } from "./FieldWrapper";

export type TextareaFieldProps = ComponentProps<typeof Textarea> & {
  label?: string;
  error?: string;
};

export const TextareaField = ({
  label,
  error,
  ...props
}: TextareaFieldProps) => {
  const field = useFieldContext<string | null | undefined>();

  return (
    <FieldWrapper
      label={label}
      name={field.name}
      error={error ?? field.state.meta.errors?.[0]?.message}
    >
      <Textarea
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
