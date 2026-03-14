import { ReactNode } from "react";

import { Label } from "@/modules/shadcn/ui/label";

export type FieldWrapperProps = {
  label?: string;
  name?: string;
  error?: string;
  children: ReactNode;
};

export const FieldWrapper = ({ label, error, children, name }: FieldWrapperProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={name} className="text-xs text-muted-foreground">{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
