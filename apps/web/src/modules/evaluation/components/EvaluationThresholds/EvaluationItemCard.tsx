import { EvalThreshold } from "@repo/schema";
import { Plus } from "lucide-react";
import { Button } from "@/modules/shadcn/ui/button";
import { ThresholdSlider } from "./ThresholdSlider";

interface EvaluationItemCardProps {
  name: string;
  thresholds: EvalThreshold[];
  onEditThreshold?: (thresholdId: string) => void;
  onAddThreshold?: () => void;
  onThresholdValueChange?: (thresholdId: string, newValue: number) => void;
}

export function EvaluationItemCard({
  name,
  thresholds,
  onEditThreshold,
  onAddThreshold,
  onThresholdValueChange,
}: EvaluationItemCardProps) {
  const hasThresholds = thresholds.length > 0;

  return (
    <div className="flex w-full items-center gap-9 rounded-xl border border-gray-300 bg-gray-100 px-6 py-2">
      <div className="flex w-50 shrink-0 flex-col gap-2 overflow-hidden">
        <span className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
          {name}
        </span>
      </div>

      {hasThresholds ? (
        <ThresholdSlider
          thresholds={thresholds}
          onEditThreshold={(threshold) => onEditThreshold?.(threshold.id)}
          onAddThreshold={onAddThreshold}
          onValueChange={onThresholdValueChange}
        />
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <p className="text-xs text-muted-foreground">
            No thresholds configured.
          </p>
          <Button variant="outline" size="xs" onClick={onAddThreshold}>
            <Plus className="size-3" />
            Add threshold
          </Button>
        </div>
      )}
    </div>
  );
}
