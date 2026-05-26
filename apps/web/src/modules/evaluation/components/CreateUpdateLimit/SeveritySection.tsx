import { useTypedAppFormContext } from "@/core/form";
import { EvalSeverityEnum } from "@repo/schema";
import { ToggleGroupField } from "../CreateTestCase/ToggleGroupField";
import { limitFormOptions } from "./limitForm.options";

const severityOptions = [
  { label: "Alert", value: EvalSeverityEnum.ALERT },
  { label: "Warning", value: EvalSeverityEnum.WARNING },
] as const;

export function SeveritySection() {
  const form = useTypedAppFormContext({ ...limitFormOptions });

  return (
    <section className="flex flex-col gap-3">
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
