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
        className="w-full [&_[data-slot=slider-track]]:bg-zinc-200"
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
