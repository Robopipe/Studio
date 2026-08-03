import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Switch } from "@/modules/shadcn/ui/switch";
import { TableCell, TableRow } from "@/modules/shadcn/ui/table";
import { SuggestibleParamDef } from "@repo/schema";

export type SuggestedValue = string | number | boolean | null;

export interface SuggestedParamRowProps {
  name: string;
  def: SuggestibleParamDef;
  currentValue: unknown;
  value: SuggestedValue;
  reasoning: string;
  onChange: (value: SuggestedValue) => void;
}

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "on" : "off";
  return String(value);
};

export const SuggestedParamRow = ({
  name,
  def,
  currentValue,
  value,
  reasoning,
  onChange,
}: SuggestedParamRowProps) => {
  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="flex flex-col" title={def.description}>
          <span className="text-sm font-medium text-black/90">{def.label}</span>
          <span className="font-mono text-xs text-black/50">{name}</span>
        </div>
      </TableCell>
      <TableCell className="align-top text-sm text-black/60">
        {formatValue(currentValue)}
      </TableCell>
      <TableCell className="align-top">
        {def.input === "enum" && (
          <Select
            value={typeof value === "string" ? value : null}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(def.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {def.input === "boolean" && (
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked)}
          />
        )}
        {(def.input === "number" || def.input === "integer") && (
          <NumberInput
            className="w-28"
            value={typeof value === "number" ? value : null}
            onValueChange={(v) => onChange(v)}
            min={def.min}
            max={def.max}
            step={def.step}
            decimal={def.input === "number"}
          />
        )}
      </TableCell>
      <TableCell className="max-w-64 align-top text-xs leading-4 text-black/60">
        {reasoning}
      </TableCell>
    </TableRow>
  );
};
