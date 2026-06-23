// FIX(naming): file is named QuantifierControlView.tsx but exports QuantifierTypeControlView for QuantifierTypeControl — fix: rename the file to QuantifierTypeControlView.tsx so file and export match; why: the folder already has QuantifierValueControlView.tsx exporting QuantifierUnitsControlView, and two near-identically named files that both mismatch their exports make the quantifier controls easy to confuse.
import type { QuantifierTypeControl } from "@/modules/evaluation/graph/editor/controls/quantifierType";
import { EvalLimitItemQuantifierTypeEnum } from "@repo/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useSyncExternalStore } from "react";

type Props = {
  data: QuantifierTypeControl;
};

export const QuantifierTypeControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);

  return (
    <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
      <Select
        value={value}
        onValueChange={(next) =>
          data.setValue(next as EvalLimitItemQuantifierTypeEnum)
        }
      >
        <SelectTrigger size="sm" className="w-full bg-white">
          <SelectValue placeholder="Select quantifier" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="MIN">MIN</SelectItem>
          <SelectItem value="MAX">MAX</SelectItem>
          <SelectItem value="EXACT">EXACT</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
