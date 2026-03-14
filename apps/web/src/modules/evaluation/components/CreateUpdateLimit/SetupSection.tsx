import { useTypedAppFormContext } from "@/core/form";
import { limitFormOptions } from "./limitForm.options";
import type { LabelOption } from "./types";

type SetupSectionProps = {
  labelOptions: LabelOption[];
};

export function SetupSection({ labelOptions }: SetupSectionProps) {
  const form = useTypedAppFormContext({ ...limitFormOptions });

  return (
    <section className="flex flex-col gap-3">
      <h6 className="text-sm font-bold">Setup</h6>
      <div className="flex gap-3">
        <div className="flex-1">
          <form.AppField name="targetLabelId">
            {(field) => (
              <field.Combobox
                label="Label"
                placeholder="Select label"
                options={labelOptions}
                parseValue={(v) => Number(v)}
                formatValue={(v) => String(v || "")}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex-1">
          <form.AppField name="targetParentLabelId">
            {(field) => (
              <field.Combobox
                label="Parent Label"
                placeholder="Select label"
                options={labelOptions}
                deselectable
                parseValue={(v) => Number(v)}
                formatValue={(v) => String(v ?? "")}
              />
            )}
          </form.AppField>
        </div>
      </div>
    </section>
  );
}
