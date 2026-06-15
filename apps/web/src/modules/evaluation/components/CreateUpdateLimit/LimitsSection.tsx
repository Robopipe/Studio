import { useTypedAppFormContext } from "@/core/form";
import { Button } from "@/modules/shadcn/ui/button";
import { PlusIcon } from "lucide-react";
import { emptyLimitItem, limitFormOptions } from "./limitForm.options";
import { LimitItemRow } from "./LimitItemRow";
import { LogicalOperatorSelect } from "./LogicalOperatorSelect";
import type { LabelOption } from "./types";

type LimitsSectionProps = {
  labelOptions: LabelOption[];
};

export function LimitsSection({ labelOptions }: LimitsSectionProps) {
  const form = useTypedAppFormContext({ ...limitFormOptions });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h6 className="text-sm font-bold">Limit Items</h6>
        <form.AppField name="limitItems">
          {(field) => (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs"
              onClick={() =>
                field.handleChange([
                  ...field.state.value,
                  { ...emptyLimitItem },
                ])
              }
            >
              <PlusIcon />
              Add limit
            </Button>
          )}
        </form.AppField>
      </div>

      <form.AppField name="limitItems">
        {(field) => (
          <div className="flex flex-col gap-3">
            {field.state.value.map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                {i > 0 && (
                  <form.AppField name={`limitItems[${i - 1}].operator`}>
                    {() => <LogicalOperatorSelect />}
                  </form.AppField>
                )}
                <LimitItemRow
                  index={i}
                  labelOptions={labelOptions}
                  onDelete={() => {
                    const updated = field.state.value.filter(
                      (_, idx) => idx !== i,
                    );
                    field.handleChange(updated);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </form.AppField>
    </section>
  );
}
