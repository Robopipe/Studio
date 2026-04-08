import { useFieldContext } from "@/core/form/hooks/useFormContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { EvalLimitItemOperatorEnum } from "@repo/schema";

const operatorOptions = [
  { label: "And", value: EvalLimitItemOperatorEnum.AND },
  { label: "Or", value: EvalLimitItemOperatorEnum.OR },
] as const;

export function LogicalOperatorSelect() {
  const field = useFieldContext<EvalLimitItemOperatorEnum>();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Logical operator</span>
      <Select
        value={field.state.value ?? EvalLimitItemOperatorEnum.AND}
        onValueChange={(v) => field.handleChange(v as EvalLimitItemOperatorEnum)}
      >
        <SelectTrigger
          size="sm"
          className="h-auto w-auto gap-1 border-0 bg-transparent p-0 text-xs font-medium shadow-none focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operatorOptions.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
