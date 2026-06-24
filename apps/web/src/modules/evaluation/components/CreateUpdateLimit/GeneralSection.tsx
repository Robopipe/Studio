import { useTypedAppFormContext } from "@/core/form";
import { Label } from "@/modules/shadcn/ui/label";
import { Switch } from "@/modules/shadcn/ui/switch";
import { limitFormOptions } from "./limitForm.options";

export function GeneralSection() {
  const form = useTypedAppFormContext({
    ...limitFormOptions,
  });

  return (
    <section className="flex flex-col gap-3">
      <h6 className="text-sm font-bold">General</h6>
      <form.AppField
        name="enabled"
        children={(field) => (
          <div className="flex items-center gap-2">
            <Label
              htmlFor={field.name}
              className="text-xs text-muted-foreground"
            >
              Enabled
            </Label>
            <Switch
              id={field.name}
              checked={field.state.value ?? false}
              onCheckedChange={(checked) =>
                field.handleChange(Boolean(checked))
              }
              onBlur={field.handleBlur}
              aria-invalid={!!field.state.meta.errors?.[0]}
            />
          </div>
        )}
      />
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextInput label="Check name" placeholder="Check name" />
        )}
      />
    </section>
  );
}
