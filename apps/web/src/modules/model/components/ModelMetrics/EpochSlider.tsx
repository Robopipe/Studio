import { Slider } from "@/modules/shadcn/ui/slider";

export interface EpochSliderProps {
  index: number;
  max: number;
  currentEpoch: number;
  lastEpoch: number;
  onChange: (v: number | number[]) => void;
}

export const EpochSlider = ({
  index,
  max,
  currentEpoch,
  lastEpoch,
  onChange,
}: EpochSliderProps) => (
  <div className="flex items-center gap-4">
    <span className="shrink-0 text-xs text-muted-foreground">Epoch</span>
    <Slider
      value={index}
      min={0}
      max={max}
      step={1}
      onValueChange={onChange}
      className="flex-1"
    />
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      {currentEpoch} / {lastEpoch}
    </span>
  </div>
);
