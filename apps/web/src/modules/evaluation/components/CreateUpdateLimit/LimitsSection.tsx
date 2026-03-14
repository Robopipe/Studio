import { Button } from "@/modules/shadcn/ui/button";
import { EvalLimitItemOperatorEnum } from "@repo/schema";
import { PlusIcon } from "lucide-react";
import { LimitItemRow } from "./LimitItemRow";
import { LogicalOperatorSelect } from "./LogicalOperatorSelect";
import type { FormInstance } from "./types";
import { emptyLimitItem } from "./useLimitForm.hook";

type LimitsSectionProps = {
  form: FormInstance;
};

export function LimitsSection({ form }: LimitsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h6 className="text-sm font-bold">Limits</h6>
        <form.Field name="limitItems">
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
        </form.Field>
      </div>

      <form.Field name="limitItems">
        {(field) => (
          <div className="flex flex-col gap-3">
            {field.state.value.map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                {i > 0 && (
                  <LogicalOperatorSelect
                    value={field.state.value[i - 1]?.operator}
                    onChange={(op: EvalLimitItemOperatorEnum) => {
                      const updated = [...field.state.value];
                      updated[i - 1] = { ...updated[i - 1]!, operator: op };
                      field.handleChange(updated);
                    }}
                  />
                )}
                <form.Field name={`limitItems[${i}]`}>
                  {(itemField) => (
                    <LimitItemRow
                      index={i}
                      field={itemField}
                      onDelete={() => {
                        const updated = field.state.value.filter(
                          (_, idx) => idx !== i,
                        );
                        field.handleChange(updated);
                      }}
                    />
                  )}
                </form.Field>
              </div>
            ))}
          </div>
        )}
      </form.Field>
    </section>
  );
}
