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

type LogicalOperatorSelectProps = {
  value: EvalLimitItemOperatorEnum | undefined;
  onChange: (value: EvalLimitItemOperatorEnum) => void;
};

export function LogicalOperatorSelect({
  value = EvalLimitItemOperatorEnum.AND,
  onChange,
}: LogicalOperatorSelectProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Logical operator</span>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as EvalLimitItemOperatorEnum)}
      >
        <SelectTrigger
          size="sm"
          className="h-auto w-auto gap-1 border-0 p-0 text-xs font-medium shadow-none"
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
