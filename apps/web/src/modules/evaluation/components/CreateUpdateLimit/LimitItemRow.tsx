import { useTypedAppFormContext } from "@/core/form";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { EvalLimitItemParameterEnum, EvalLimitItemQuantifierTypeEnum, EvalLimitItemQuantifierUnitEnum } from "@repo/schema";
import { Trash2Icon } from "lucide-react";
import { parameterLabel, parameterUnit } from "../../utils/limitFormatters";
import { limitFormOptions } from "./limitForm.options";
import { PositionButton } from "./PositionButton";

const parameterOptions = Object.values(EvalLimitItemParameterEnum).map((p) => ({
  value: p,
  label: parameterLabel[p] ?? p,
}));

const quantifierTypeOptions = Object.values(EvalLimitItemQuantifierTypeEnum).map((t) => ({
  value: t,
  label: t,
}));

const quantifierUnitLabels: Record<EvalLimitItemQuantifierUnitEnum, string> = {
  [EvalLimitItemQuantifierUnitEnum.PERCENT]: "%",
  [EvalLimitItemQuantifierUnitEnum.PCS]: "Pcs",
};

const quantifierUnitOptions = Object.values(EvalLimitItemQuantifierUnitEnum).map((u) => ({
  value: u,
  label: quantifierUnitLabels[u],
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
        const isCount = parameter === EvalLimitItemParameterEnum.COUNT;

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

            {!isCount && (
              <form.AppField name={`limitItems[${index}].quantifierUnit`}>
                {(unitField) => {
                  const quantifierUnit = unitField.state.value as EvalLimitItemQuantifierUnitEnum;
                  const quantifierUnitLabel = quantifierUnitLabels[quantifierUnit] ?? "%";
                  return (
                    <div className="flex w-48 shrink-0 flex-col">
                      {showLabels && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">Objects count</span>
                          <Select
                            value={quantifierUnit}
                            onValueChange={(v) => unitField.handleChange(v as EvalLimitItemQuantifierUnitEnum)}
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-auto w-auto gap-1 border-0 p-0 text-xs font-medium shadow-none"
                            >
                              <span className="text-xs text-muted-foreground">Units</span>
                              <SelectValue>{quantifierUnitLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {quantifierUnitOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="w-24">
                          <form.AppField name={`limitItems[${index}].quantifierType`}>
                            {(field) => (
                              <field.SelectInput options={quantifierTypeOptions} />
                            )}
                          </form.AppField>
                        </div>
                        <div className="flex-1">
                          <form.AppField name={`limitItems[${index}].quantifierValue`}>
                            {(field) => (
                              <field.NumberInput unit={quantifierUnitLabel} />
                            )}
                          </form.AppField>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </form.AppField>
            )}

            <div className="flex flex-1 items-end gap-3">
              <div className="flex-1">
                <paramField.SelectInput
                  label={showLabels ? "Parameter" : undefined}
                  options={parameterOptions}
                  parseValue={(v) => {
                    if (v === EvalLimitItemParameterEnum.COUNT) {
                      form.setFieldValue(`limitItems[${index}].quantifierType`, EvalLimitItemQuantifierTypeEnum.EXACT);
                      form.setFieldValue(`limitItems[${index}].quantifierUnit`, EvalLimitItemQuantifierUnitEnum.PERCENT);
                      form.setFieldValue(`limitItems[${index}].quantifierValue`, 100);
                    }
                    return v;
                  }}
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
