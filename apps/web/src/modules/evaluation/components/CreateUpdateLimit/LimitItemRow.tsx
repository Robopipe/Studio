import { Button } from "@/modules/shadcn/ui/button";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { EvalLimitItemParameterEnum } from "@repo/schema";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Trash2Icon } from "lucide-react";
import { parameterLabel, parameterUnit } from "../../utils/limitFormatters";
import { LimitInput } from "./LimitInput";
import { PositionButton } from "./PositionButton";

const parameterOptions = Object.values(EvalLimitItemParameterEnum);
const isPositionParam = (p: string) => p.startsWith("POS_");

type LimitItemRowProps = {
  index: number;
  field: AnyFieldApi;
  onDelete: () => void;
};

export function LimitItemRow({ index, field, onDelete }: LimitItemRowProps) {
  const value = field.state.value;
  const parameter = value.parameter as EvalLimitItemParameterEnum;
  const unit = parameterUnit[parameter] ?? "%";
  const showLabels = index === 0;
  const showPosition = isPositionParam(parameter);

  const handleChange = (patch: Record<string, unknown>) =>
    field.handleChange({ ...value, ...patch });

  return (
    <div className="flex items-end gap-8">
      <div className="flex shrink-0 items-end gap-3">
        <LimitInput
          label={showLabels ? "Limit from" : undefined}
          value={value.limitFrom}
          unit={unit}
          onChange={(v) => handleChange({ limitFrom: v })}
        />
        <LimitInput
          label={showLabels ? "Limit to" : undefined}
          value={value.limitTo}
          unit={unit}
          onChange={(v) => handleChange({ limitTo: v })}
        />
      </div>

      <div className="flex flex-1 items-end gap-3">
        <div className="flex flex-1 flex-col gap-2">
          {showLabels && (
            <Label className="text-xs text-muted-foreground">Parameter</Label>
          )}
          <Select
            value={parameter}
            onValueChange={(v) =>
              handleChange({ parameter: v as EvalLimitItemParameterEnum })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parameterOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {parameterLabel[p] ?? p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
}
