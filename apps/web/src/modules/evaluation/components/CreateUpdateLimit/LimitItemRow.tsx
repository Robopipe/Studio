import { useTypedAppFormContext } from "@/core/form";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
} from "@repo/schema";
import { Trash2Icon } from "lucide-react";
import {
  edgeLabel,
  parameterLabel,
  parameterUnit,
  quantifierTypeLabel,
} from "../../utils/limitFormatters";
import { limitFormOptions } from "./limitForm.options";

const parameterOptions = Object.values(EvalLimitItemParameterEnum).map((p) => ({
  value: p,
  label: parameterLabel[p] ?? p,
}));

const quantifierTypeOptions = Object.values(
  EvalLimitItemQuantifierTypeEnum,
).map((t) => ({
  value: t,
  label: quantifierTypeLabel[t] ?? t,
}));

const quantifierUnitLabels: Record<EvalLimitItemQuantifierUnitEnum, string> = {
  [EvalLimitItemQuantifierUnitEnum.PERCENT]: "%",
  [EvalLimitItemQuantifierUnitEnum.PCS]: "Pcs",
};

const quantifierUnitOptions = Object.values(
  EvalLimitItemQuantifierUnitEnum,
).map((u) => ({
  value: u,
  label: quantifierUnitLabels[u],
}));

const allEdgeOptions = Object.values(EvalLimitItemEdgeEnum).map((e) => ({
  value: e,
  label: edgeLabel[e],
}));

const horizontal = new Set([EvalLimitItemEdgeEnum.LEFT, EvalLimitItemEdgeEnum.RIGHT]);
const vertical = new Set([EvalLimitItemEdgeEnum.TOP, EvalLimitItemEdgeEnum.BOTTOM]);

function parentOptionsForTarget(targetEdge: EvalLimitItemEdgeEnum) {
  if (horizontal.has(targetEdge)) {
    return allEdgeOptions.filter((o) => horizontal.has(o.value as EvalLimitItemEdgeEnum) || o.value === EvalLimitItemEdgeEnum.CENTER);
  }
  if (vertical.has(targetEdge)) {
    return allEdgeOptions.filter((o) => vertical.has(o.value as EvalLimitItemEdgeEnum) || o.value === EvalLimitItemEdgeEnum.CENTER);
  }
  return allEdgeOptions;
}

function isEdgeCompatible(targetEdge: EvalLimitItemEdgeEnum, parentEdge: EvalLimitItemEdgeEnum): boolean {
  if (targetEdge === EvalLimitItemEdgeEnum.CENTER || parentEdge === EvalLimitItemEdgeEnum.CENTER) return true;
  if (horizontal.has(targetEdge) && horizontal.has(parentEdge)) return true;
  if (vertical.has(targetEdge) && vertical.has(parentEdge)) return true;
  return false;
}

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
        const isCount = parameter === EvalLimitItemParameterEnum.COUNT;
        const isPosition = parameter === EvalLimitItemParameterEnum.POSITION;
        const verb = isPosition ? "have" : "has";

        return (
          <div className="flex items-end gap-8">
            {!isCount && (
              <form.AppField name={`limitItems[${index}].quantifierUnit`}>
                {(unitField) => {
                  const quantifierUnit = unitField.state
                    .value as EvalLimitItemQuantifierUnitEnum;
                  const quantifierUnitLabel =
                    quantifierUnitLabels[quantifierUnit] ?? "%";
                  return (
                    <div className="flex w-48 shrink-0 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        {showLabels ? (
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            Objects count
                          </span>
                        ) : (
                          <span />
                        )}
                        <Select
                          value={quantifierUnit}
                          onValueChange={(v) =>
                            unitField.handleChange(
                              v as EvalLimitItemQuantifierUnitEnum,
                            )
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className="h-auto w-auto gap-1 border-0 bg-transparent p-0 text-xs font-medium shadow-none focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
                          >
                            <span className="text-xs text-muted-foreground">
                              Units
                            </span>
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
                      <div className="flex gap-2">
                        <div className="w-24">
                          <form.AppField
                            name={`limitItems[${index}].quantifierType`}
                          >
                            {(field) => (
                              <field.SelectInput
                                options={quantifierTypeOptions}
                              />
                            )}
                          </form.AppField>
                        </div>
                        <div className="flex-1">
                          <form.AppField
                            name={`limitItems[${index}].quantifierValue`}
                          >
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

            {!isCount && (
              <span className="pb-2 text-sm text-muted-foreground">{verb}</span>
            )}

            <div className="min-w-40 flex-1">
              <paramField.SelectInput
                label={showLabels ? "Parameter" : undefined}
                options={parameterOptions}
                parseValue={(v) => {
                  if (v === EvalLimitItemParameterEnum.COUNT) {
                    form.setFieldValue(
                      `limitItems[${index}].quantifierType`,
                      EvalLimitItemQuantifierTypeEnum.EXACT,
                    );
                    form.setFieldValue(
                      `limitItems[${index}].quantifierUnit`,
                      EvalLimitItemQuantifierUnitEnum.PERCENT,
                    );
                    form.setFieldValue(
                      `limitItems[${index}].quantifierValue`,
                      100,
                    );
                  }
                  return v;
                }}
              />
            </div>

            {isPosition && (
              <>
                <span className="pb-2 text-sm text-muted-foreground">of</span>
                <form.AppField name={`limitItems[${index}].targetEdge`}>
                  {(targetField) => {
                    const targetEdge = targetField.state.value as EvalLimitItemEdgeEnum;
                    return (
                      <>
                        <div className="min-w-28">
                          <targetField.SelectInput
                            label={showLabels ? "Target" : undefined}
                            options={allEdgeOptions}
                            parseValue={(v) => {
                              const newTarget = v as EvalLimitItemEdgeEnum;
                              const currentParent = form.getFieldValue(`limitItems[${index}].parentEdge`) as EvalLimitItemEdgeEnum;
                              if (!isEdgeCompatible(newTarget, currentParent)) {
                                form.setFieldValue(`limitItems[${index}].parentEdge`, EvalLimitItemEdgeEnum.CENTER);
                              }
                              return newTarget;
                            }}
                          />
                        </div>
                        <span className="pb-2 text-sm text-muted-foreground">from</span>
                        <form.AppField name={`limitItems[${index}].parentEdge`}>
                          {(parentField) => (
                            <div className="min-w-28">
                              <parentField.SelectInput
                                label={showLabels ? "Parent" : undefined}
                                options={parentOptionsForTarget(targetEdge)}
                              />
                            </div>
                          )}
                        </form.AppField>
                      </>
                    );
                  }}
                </form.AppField>
              </>
            )}

            <span className="pb-2 text-sm text-muted-foreground">in</span>

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
        );
      }}
    </form.AppField>
  );
}
