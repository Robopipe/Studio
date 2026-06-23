import { useTypedAppFormContext } from "@/core/form";
import { Button } from "@/modules/shadcn/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/modules/shadcn/ui/input-group";
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
import { useEffect, useState } from "react";
import {
  edgeLabel,
  parameterLabel,
  parameterUnit,
  quantifierTypeLabel,
} from "../../utils/limitFormatters";
import { limitFormOptions } from "./limitForm.options";
import type { LabelOption } from "./types";

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

const horizontal = new Set([
  EvalLimitItemEdgeEnum.LEFT,
  EvalLimitItemEdgeEnum.RIGHT,
]);
const vertical = new Set([
  EvalLimitItemEdgeEnum.TOP,
  EvalLimitItemEdgeEnum.BOTTOM,
]);

function parentOptionsForTarget(targetEdge: EvalLimitItemEdgeEnum) {
  if (horizontal.has(targetEdge)) {
    return allEdgeOptions.filter(
      (o) =>
        horizontal.has(o.value as EvalLimitItemEdgeEnum) ||
        o.value === EvalLimitItemEdgeEnum.CENTER,
    );
  }
  if (vertical.has(targetEdge)) {
    return allEdgeOptions.filter(
      (o) =>
        vertical.has(o.value as EvalLimitItemEdgeEnum) ||
        o.value === EvalLimitItemEdgeEnum.CENTER,
    );
  }
  return allEdgeOptions;
}

function isEdgeCompatible(
  targetEdge: EvalLimitItemEdgeEnum,
  parentEdge: EvalLimitItemEdgeEnum,
): boolean {
  if (
    targetEdge === EvalLimitItemEdgeEnum.CENTER ||
    parentEdge === EvalLimitItemEdgeEnum.CENTER
  )
    return true;
  if (horizontal.has(targetEdge) && horizontal.has(parentEdge)) return true;
  if (vertical.has(targetEdge) && vertical.has(parentEdge)) return true;
  return false;
}

type QuantifierCompositeProps = {
  valueField: any;
  unitField: any;
};

function QuantifierComposite({
  valueField,
  unitField,
}: QuantifierCompositeProps) {
  const [shownValue, setShownValue] = useState<string>(
    () => valueField.state.value?.toString() ?? "",
  );

  useEffect(() => {
    const v = valueField.state.value;
    setShownValue(v == null ? "" : v.toString());
  }, [valueField.state.value]);

  const handleChange = (text: string) => {
    const clean = text.replace(/[^0-9.,]/g, "");
    setShownValue(clean);
    if (clean === "") {
      valueField.handleChange(null);
      return;
    }
    const transformed = clean.replace(/,/g, ".");
    if (transformed === ".") return;
    const n = Number(transformed);
    if (!isNaN(n)) valueField.handleChange(n);
  };

  const unitValue = unitField.state.value as EvalLimitItemQuantifierUnitEnum;

  return (
    <InputGroup>
      <InputGroupInput
        value={shownValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={valueField.handleBlur}
        inputMode="decimal"
        aria-invalid={!!valueField.state.meta.errors?.[0]}
      />
      <InputGroupAddon align="inline-end">
        <Select
          value={unitValue}
          onValueChange={(v) =>
            unitField.handleChange(v as EvalLimitItemQuantifierUnitEnum)
          }
        >
          <SelectTrigger
            size="sm"
            className="h-auto w-auto gap-1 border-0 bg-transparent p-0 shadow-none focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
          >
            <SelectValue>{quantifierUnitLabels[unitValue] ?? "%"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {quantifierUnitOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InputGroupAddon>
    </InputGroup>
  );
}

type LimitItemRowProps = {
  index: number;
  onDelete: () => void;
  labelOptions: LabelOption[];
};

export function LimitItemRow({
  index,
  onDelete,
  labelOptions,
}: LimitItemRowProps) {
  const form = useTypedAppFormContext({ ...limitFormOptions });

  return (
    <form.Subscribe
      selector={(state) => ({
        targetLabelId: state.values.targetLabelId,
        targetParentLabelId: state.values.targetParentLabelId,
      })}
    >
      {({ targetLabelId, targetParentLabelId }) => {
        const targetName =
          labelOptions.find((o) => o.value === String(targetLabelId || ""))
            ?.label ?? "";
        const parentName = targetParentLabelId
          ? (labelOptions.find((o) => o.value === String(targetParentLabelId))
              ?.label ?? null)
          : null;
        const parentLabel = parentName ?? "Scene";
        const parentAnnotation = parentName ?? "scene";

        return (
          <form.AppField name={`limitItems[${index}].parameter`}>
            {(paramField) => {
              const parameter = paramField.state
                .value as EvalLimitItemParameterEnum;
              const unit = parameterUnit[parameter] ?? "%";
              const isCount = parameter === EvalLimitItemParameterEnum.COUNT;
              const isPosition =
                parameter === EvalLimitItemParameterEnum.POSITION;

              const parameterSelect = (
                <div className="w-32 shrink-0">
                  <paramField.SelectInput
                    label="Parameter"
                    options={parameterOptions}
                    parseValue={(v) => {
                      const prev = paramField.state
                        .value as EvalLimitItemParameterEnum;
                      const next = v as EvalLimitItemParameterEnum;
                      if (next === EvalLimitItemParameterEnum.COUNT) {
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
                        form.setFieldValue(
                          `limitItems[${index}].targetEdge`,
                          EvalLimitItemEdgeEnum.CENTER,
                        );
                        form.setFieldValue(
                          `limitItems[${index}].parentEdge`,
                          EvalLimitItemEdgeEnum.CENTER,
                        );
                      } else if (prev === EvalLimitItemParameterEnum.COUNT) {
                        form.setFieldValue(
                          `limitItems[${index}].quantifierType`,
                          EvalLimitItemQuantifierTypeEnum.MIN,
                        );
                        form.setFieldValue(
                          `limitItems[${index}].quantifierUnit`,
                          EvalLimitItemQuantifierUnitEnum.PERCENT,
                        );
                        form.setFieldValue(
                          `limitItems[${index}].quantifierValue`,
                          50,
                        );
                      }
                      return next;
                    }}
                  />
                </div>
              );

              const deleteButton = (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 self-end text-muted-foreground hover:text-destructive"
                  aria-label="Delete limit"
                  onClick={onDelete}
                >
                  <Trash2Icon className="text-destructive" />
                </Button>
              );

              if (isCount) {
                return (
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
                    {parameterSelect}
                    <div className="w-20 shrink-0">
                      <form.AppField name={`limitItems[${index}].limitFrom`}>
                        {(field) => (
                          <field.NumberInput label="From" unit={unit} />
                        )}
                      </form.AppField>
                    </div>
                    <div className="w-20 shrink-0">
                      <form.AppField name={`limitItems[${index}].limitTo`}>
                        {(field) => (
                          <field.NumberInput label="To" unit={unit} />
                        )}
                      </form.AppField>
                    </div>
                    {deleteButton}
                  </div>
                );
              }

              const quantifierSection = (
                <>
                  <div className="w-32 shrink-0">
                    <form.AppField name={`limitItems[${index}].quantifierType`}>
                      {(field) => (
                        <field.SelectInput options={quantifierTypeOptions} />
                      )}
                    </form.AppField>
                  </div>
                  <div className="w-32 shrink-0">
                    <form.AppField name={`limitItems[${index}].quantifierUnit`}>
                      {(unitField) => (
                        <form.AppField
                          name={`limitItems[${index}].quantifierValue`}
                        >
                          {(valueField) => (
                            <QuantifierComposite
                              valueField={valueField}
                              unitField={unitField}
                            />
                          )}
                        </form.AppField>
                      )}
                    </form.AppField>
                  </div>
                  {targetName && (
                    <span className="shrink-0 self-end pb-2 whitespace-nowrap text-xs text-muted-foreground">
                      (of the detections)
                    </span>
                  )}
                </>
              );

              if (isPosition) {
                return (
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
                    {parameterSelect}
                    <form.AppField name={`limitItems[${index}].targetEdge`}>
                      {(targetField) => {
                        const targetEdge = targetField.state
                          .value as EvalLimitItemEdgeEnum;
                        return (
                          <>
                            <div className="w-28 shrink-0">
                              <targetField.SelectInput
                                label={targetName || "Detection"}
                                options={allEdgeOptions}
                                parseValue={(v) => {
                                  const newTarget = v as EvalLimitItemEdgeEnum;
                                  const currentParent = form.getFieldValue(
                                    `limitItems[${index}].parentEdge`,
                                  ) as EvalLimitItemEdgeEnum;
                                  if (
                                    !isEdgeCompatible(newTarget, currentParent)
                                  ) {
                                    form.setFieldValue(
                                      `limitItems[${index}].parentEdge`,
                                      EvalLimitItemEdgeEnum.CENTER,
                                    );
                                  }
                                  return newTarget;
                                }}
                              />
                            </div>
                            <form.AppField
                              name={`limitItems[${index}].parentEdge`}
                            >
                              {(parentField) => (
                                <div className="w-28 shrink-0">
                                  <parentField.SelectInput
                                    label={parentLabel}
                                    options={parentOptionsForTarget(targetEdge)}
                                  />
                                </div>
                              )}
                            </form.AppField>
                          </>
                        );
                      }}
                    </form.AppField>
                    <div className="w-20 shrink-0">
                      <form.AppField name={`limitItems[${index}].limitFrom`}>
                        {(field) => (
                          <field.NumberInput label="From" unit={unit} />
                        )}
                      </form.AppField>
                    </div>
                    <div className="w-20 shrink-0">
                      <form.AppField name={`limitItems[${index}].limitTo`}>
                        {(field) => (
                          <field.NumberInput label="To" unit={unit} />
                        )}
                      </form.AppField>
                    </div>
                    <span className="shrink-0 self-end pb-2 whitespace-nowrap text-xs text-muted-foreground">
                      (of the {parentAnnotation})
                    </span>
                    {quantifierSection}
                    {deleteButton}
                  </div>
                );
              }

              // AREA
              return (
                <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
                  {parameterSelect}
                  <div className="w-20 shrink-0">
                    <form.AppField name={`limitItems[${index}].limitFrom`}>
                      {(field) => (
                        <field.NumberInput label="From" unit={unit} />
                      )}
                    </form.AppField>
                  </div>
                  <div className="w-20 shrink-0">
                    <form.AppField name={`limitItems[${index}].limitTo`}>
                      {(field) => <field.NumberInput label="To" unit={unit} />}
                    </form.AppField>
                  </div>
                  <span className="shrink-0 self-end pb-2 whitespace-nowrap text-xs text-muted-foreground">
                    (of the {parentAnnotation})
                  </span>
                  {quantifierSection}
                  {deleteButton}
                </div>
              );
            }}
          </form.AppField>
        );
      }}
    </form.Subscribe>
  );
}
