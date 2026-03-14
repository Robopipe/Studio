import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import type { FormInstance } from "./types";

type GeneralSectionProps = {
  form: FormInstance;
};

export function GeneralSection({ form }: GeneralSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h6 className="text-sm font-bold">General</h6>
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="limit-name"
              className="text-xs text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="limit-name"
              placeholder="Limit name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>
    </section>
  );
}
