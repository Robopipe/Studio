import { useTypedAppFormContext } from "@/core/form";
import { limitFormOptions } from "./limitForm.options";

export function GeneralSection() {
  const form = useTypedAppFormContext({
    ...limitFormOptions,
  });

  return (
    <section className="flex flex-col gap-3">
      <h6 className="text-sm font-bold">General</h6>
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextInput label="Limit name" placeholder="Limit name" />
        )}
      />
    </section>
  );
}
