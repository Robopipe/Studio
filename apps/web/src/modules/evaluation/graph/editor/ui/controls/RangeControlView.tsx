// FIX(naming): file is named RangeControlView.tsx but exports PercentageRangeControlView for PercentageRangeControl — fix: rename the file to PercentageRangeControlView.tsx so file and export match; why: the sibling IntegerRangeControlView.tsx follows the file==export convention, and the generic "RangeControlView" name makes it ambiguous which of the two range controls this file renders.
import type { PercentageRangeControl } from "@/modules/evaluation/graph/editor/controls/percentageRange";
import { Slider } from "@/modules/shadcn/ui/slider";
import { useSyncExternalStore } from "react";

type Props = {
  data: PercentageRangeControl;
};

export const PercentageRangeControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);

  return (
    <div
      className="w-full flex flex-col gap-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between text-sm text-zinc-400">
        <span>From: {value[0]}%</span>
        <span>To: {value[1]}%</span>
      </div>

      <Slider
        value={value}
        min={data.min}
        max={data.max}
        step={data.step}
        className="w-full"
        onValueChange={(next) => {
          if (typeof next === "number") return;

          const [first, second] = next;
          if (first === undefined || second === undefined) return;

          data.setValue(first <= second ? [first, second] : [second, first]);
        }}
      />
    </div>
  );
};
