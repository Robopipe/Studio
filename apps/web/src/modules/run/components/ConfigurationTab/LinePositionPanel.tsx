import { LineConfig } from "@/modules/dashboard/components/DashboardLineConfiguration";
import { Input } from "@/modules/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";

interface LinePositionPanelProps {
  value: LineConfig;
  onChange: (value: LineConfig) => void;
}

const FLOW_OPTIONS = {
  vertical: [
    {
      value: DashboardConfigurationLineFlowEnum.POSITIVE,
      label: "Left to right",
    },
    {
      value: DashboardConfigurationLineFlowEnum.NEGATIVE,
      label: "Right to left",
    },
  ],
  horizontal: [
    {
      value: DashboardConfigurationLineFlowEnum.POSITIVE,
      label: "Top to bottom",
    },
    {
      value: DashboardConfigurationLineFlowEnum.NEGATIVE,
      label: "Bottom to top",
    },
  ],
};

export const LinePositionPanel = ({
  value,
  onChange,
}: LinePositionPanelProps) => {
  const isVertical =
    value.lineDirection === DashboardConfigurationLineDirectionEnum.VERTICAL;
  const flowOptions = isVertical
    ? FLOW_OPTIONS.vertical
    : FLOW_OPTIONS.horizontal;

  return (
    <div className="flex w-72 shrink-0 flex-1 flex-col gap-6 p-6">
      <h2 className="text-sm font-semibold">Setup Line Position</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Direction</label>
          <Select
            value={value.lineDirection}
            onValueChange={(v) =>
              onChange({
                ...value,
                lineDirection: v as DashboardConfigurationLineDirectionEnum,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value={DashboardConfigurationLineDirectionEnum.HORIZONTAL}
              >
                Horizontal
              </SelectItem>
              <SelectItem
                value={DashboardConfigurationLineDirectionEnum.VERTICAL}
              >
                Vertical
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Position</label>
          <div className="relative">
            <Input
              type="number"
              value={value.linePosition}
              min={0}
              max={100}
              onChange={(e) =>
                onChange({ ...value, linePosition: Number(e.target.value) })
              }
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Flow</label>
          <Select
            key={isVertical ? "vertical" : "horizontal"}
            value={value.lineFlow}
            onValueChange={(v) =>
              onChange({
                ...value,
                lineFlow: v as DashboardConfigurationLineFlowEnum,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {flowOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
