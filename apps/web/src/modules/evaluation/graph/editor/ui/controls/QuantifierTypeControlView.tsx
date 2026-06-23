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
