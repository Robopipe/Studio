import { EvalTestCaseThreshold } from "@repo/schema";
import { Plus } from "lucide-react";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Label } from "@/modules/shadcn/ui/label";
import { ThresholdSlider } from "./ThresholdSlider";

interface EvaluationItemCardProps {
  testCase: EvalTestCaseThreshold;
  displayOnDashboard: boolean;
  onDisplayOnDashboardChange: (checked: boolean) => void;
  onEditThreshold?: (thresholdId: string) => void;
  onAddThreshold?: () => void;
  onThresholdValueChange?: (thresholdId: string, newValue: number) => void;
}

export function EvaluationItemCard({
  testCase,
  displayOnDashboard,
  onDisplayOnDashboardChange,
  onEditThreshold,
  onAddThreshold,
  onThresholdValueChange,
}: EvaluationItemCardProps) {
  const hasThresholds = testCase.thresholds.length > 0;

  return (
    <div className="flex w-full items-center gap-9 rounded-xl border border-gray-300 bg-gray-100 px-6 py-2">
      {/* Left: name + checkbox */}
      <div className="flex w-[200px] shrink-0 flex-col gap-2 overflow-hidden">
        <span className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
          {testCase.name}
        </span>
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={displayOnDashboard}
            onCheckedChange={(checked) =>
              onDisplayOnDashboardChange(checked === true)
            }
          />
          <Label className="text-xs font-medium leading-4 text-foreground cursor-pointer">
            Display on dashboard
          </Label>
        </div>
      </div>

      {/* Right: threshold slider or empty state */}
      {hasThresholds ? (
        <ThresholdSlider
          thresholds={testCase.thresholds}
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
