import { ComponentProps } from "react";

import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { useFieldContext } from "../hooks/useFormContext";

export type CheckboxFieldProps = Omit<
  ComponentProps<typeof Checkbox>,
  "checked" | "onCheckedChange"
>;

export const CheckboxField = ({ ...props }: CheckboxFieldProps) => {
  const field = useFieldContext<boolean>();

  return (
    <Checkbox
      id={field.name}
      checked={field.state.value ?? false}
      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
      onBlur={field.handleBlur}
      aria-invalid={!!field.state.meta.errors?.[0]}
      {...props}
    />
  );
};
