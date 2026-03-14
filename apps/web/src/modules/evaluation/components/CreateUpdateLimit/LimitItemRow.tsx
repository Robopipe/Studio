import { useTypedAppFormContext } from "@/core/form";
import { Button } from "@/modules/shadcn/ui/button";
import { EvalLimitItemParameterEnum } from "@repo/schema";
import { Trash2Icon } from "lucide-react";
import { parameterLabel, parameterUnit } from "../../utils/limitFormatters";
import { limitFormOptions } from "./limitForm.options";
import { PositionButton } from "./PositionButton";

const parameterOptions = Object.values(EvalLimitItemParameterEnum).map((p) => ({
  value: p,
  label: parameterLabel[p] ?? p,
}));

const isPositionParam = (p: string) => p.startsWith("POS_");

type LimitItemRowProps = {
  index: number;
  onDelete: () => void;
};

export function LimitItemRow({ index, onDelete }: LimitItemRowProps) {
  const form = useTypedAppFormContext({ ...limitFormOptions });
  const showLabels = index === 0;

  return (
    <form.AppField name={`limitItems[${index}].parameter`}>
      {(paramField) => {
        const parameter = paramField.state.value as EvalLimitItemParameterEnum;
        const unit = parameterUnit[parameter] ?? "%";
        const showPosition = isPositionParam(String(parameter));

        return (
          <div className="flex items-end gap-8">
            <div className="flex shrink-0 items-end gap-3">
              <div className="w-27">
                <form.AppField name={`limitItems[${index}].limitFrom`}>
                  {(field) => (
                    <field.NumberInput
                      label={showLabels ? "Limit from" : undefined}
                      unit={unit}
                    />
                  )}
                </form.AppField>
              </div>
              <div className="w-27">
                <form.AppField name={`limitItems[${index}].limitTo`}>
                  {(field) => (
                    <field.NumberInput
                      label={showLabels ? "Limit to" : undefined}
                      unit={unit}
                    />
                  )}
                </form.AppField>
              </div>
            </div>

            <div className="flex flex-1 items-end gap-3">
              <div className="flex-1">
                <paramField.SelectInput
                  label={showLabels ? "Parameter" : undefined}
                  options={parameterOptions}
                />
              </div>

              {showPosition && <PositionButton />}

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete limit"
                onClick={onDelete}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        );
      }}
    </form.AppField>
  );
}
