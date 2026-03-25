import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";
import React from "react";

const FlowArrow = ({
  isVertical,
  isNegative,
  linePosition,
}: {
  isVertical: boolean;
  isNegative: boolean;
  linePosition: number;
}) => {
  // Arrow SVG points down at 0° rotation
  // Horizontal line: positive = down (0°), negative = up (180°)
  // Vertical line:   positive = right (270°), negative = left (90°)
  const rotate = isVertical
    ? isNegative
      ? 90
      : 270
    : isNegative
      ? 180
      : 0;

  const style: React.CSSProperties = isVertical
    ? {
        top: "50%",
        left: `${linePosition}%`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      }
    : {
        left: "50%",
        top: `${linePosition}%`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      };

  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      style={{
        position: "absolute",
        pointerEvents: "none",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
        ...style,
      }}
    >
      <path
        d="M4 7 L10 15 L16 7"
        fill="none"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7 L10 15 L16 7"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: [string, string];
  value: 0 | 1;
  onChange: (value: 0 | 1) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-md border border-input bg-muted p-0.5 text-sm">
      {options.map((label, i) => (
        <button
          key={label}
          type="button"
          className={`whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition-colors ${
            value === i
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange(i as 0 | 1)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export interface LineConfig {
  lineDirection: DashboardConfigurationLineDirectionEnum;
  linePosition: number;
  lineFlow: DashboardConfigurationLineFlowEnum;
}

export interface DashboardLineConfigurationProps {
  projectId: number;
  value: LineConfig;
  onChange: (value: LineConfig) => void;
}

export const DashboardLineConfiguration = ({
  projectId,
  value,
  onChange,
}: DashboardLineConfigurationProps) => {
  const { data: tasks } = useGetTasksQuery({ projectId, limit: 1 });

  const isVertical =
    value.lineDirection === DashboardConfigurationLineDirectionEnum.VERTICAL;

  // UI uses 0-100 for display, LineConfig stores 0-100 too (converted to 0-1 on save)
  const linePositionPct = value.linePosition;

  const lineStyle: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        top: 0,
        left: `${linePositionPct}%`,
        width: 2,
        height: "100%",
        background: "#ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        left: 0,
        top: `${linePositionPct}%`,
        height: 2,
        width: "100%",
        background: "#ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      };

  return (
    <div className="flex flex-col gap-3">
      <h5 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
        Line
      </h5>

      <div className="flex gap-6">
        <div className="flex shrink-0 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Direction</Label>
            <ToggleGroup
              options={["Horizontal", "Vertical"]}
              value={isVertical ? 1 : 0}
              onChange={(v) =>
                onChange({
                  ...value,
                  lineDirection:
                    v === 1
                      ? DashboardConfigurationLineDirectionEnum.VERTICAL
                      : DashboardConfigurationLineDirectionEnum.HORIZONTAL,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Position</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-24"
                value={linePositionPct}
                min={0}
                max={100}
                onChange={(e) =>
                  onChange({ ...value, linePosition: Number(e.target.value) })
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Flow</Label>
            <ToggleGroup
              options={
                isVertical
                  ? ["Left to right", "Right to left"]
                  : ["Top to bottom", "Bottom to top"]
              }
              value={
                value.lineFlow === DashboardConfigurationLineFlowEnum.POSITIVE
                  ? 0
                  : 1
              }
              onChange={(v) =>
                onChange({
                  ...value,
                  lineFlow:
                    v === 0
                      ? DashboardConfigurationLineFlowEnum.POSITIVE
                      : DashboardConfigurationLineFlowEnum.NEGATIVE,
                })
              }
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-md border border-border">
          <img
            className="block h-auto max-h-60 w-auto max-w-90 object-contain"
            src={tasks?.data[0]?.filePath}
            alt="Task line preview"
          />
          <div style={lineStyle} />
          <FlowArrow
            isVertical={isVertical}
            isNegative={
              value.lineFlow === DashboardConfigurationLineFlowEnum.NEGATIVE
            }
            linePosition={linePositionPct}
          />
        </div>
      </div>
    </div>
  );
};
