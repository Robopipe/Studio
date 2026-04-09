import { useTypedAppFormContext } from "@/core/form";
import { EvalSeverityEnum } from "@repo/schema";
import { ToggleGroupField } from "../CreateTestCase/ToggleGroupField";
import { limitFormOptions } from "./limitForm.options";

const severityOptions = [
  { label: "Alert", value: EvalSeverityEnum.ALERT },
  { label: "Warning", value: EvalSeverityEnum.WARNING },
] as const;

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
      <form.AppField name="severity">
        {() => (
          <ToggleGroupField
            label="If not fulfilled"
            options={[...severityOptions]}
          />
        )}
      </form.AppField>
    </section>
  );
}
