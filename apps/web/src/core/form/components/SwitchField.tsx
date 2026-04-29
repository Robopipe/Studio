import { ComponentProps } from "react";

import { Label } from "@/modules/shadcn/ui/label";
import { Switch } from "@/modules/shadcn/ui/switch";
import { useFieldContext } from "../hooks/useFormContext";

export type SwitchFieldProps = Omit<
  ComponentProps<typeof Switch>,
  "checked" | "onCheckedChange"
> & {
  label?: string;
};

export const SwitchField = ({ label, ...props }: SwitchFieldProps) => {
  const field = useFieldContext<boolean>();

  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <Label htmlFor={field.name} className="text-xs text-muted-foreground">
          {label}
        </Label>
      )}
      <Switch
        id={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
        onBlur={field.handleBlur}
        aria-invalid={!!field.state.meta.errors?.[0]}
        {...props}
      />
    </div>
  );
};
