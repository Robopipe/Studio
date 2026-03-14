import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";
import { Heading, NumberInput, Stack, Switch } from "@repo/ui";
import React, { useState } from "react";

const FlowArrow = ({
  isVertical,
  isNegative,
  linePosition,
}: {
  isVertical: boolean;
  isNegative: boolean;
  linePosition: number;
}) => {
  // rotate: horizontal positive = down (90°), negative = up (270°)
  //         vertical positive = right (0°), negative = left (180°)
  // Arrow SVG points up at 0°
  // Horizontal line: positive = down (180°), negative = up (0°)
  // Vertical line:   positive = right (90°), negative = left (270°)
  const rotate = isVertical
    ? isNegative ? 270 : 90
    : isNegative ? 0 : 180;

  const style: React.CSSProperties = isVertical
    ? { top: "50%", left: `${linePosition}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)` }
    : { left: "50%", top: `${linePosition}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)` };

  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      <polygon points="12,2 22,22 12,17 2,22" fill="red" />
    </svg>
  );
};

export interface DashboardLineConfigurationProps {
  projectId: number;
  configId: number;
}

export const DashboardLineConfiguration = ({
  projectId,
  // configId,
}: DashboardLineConfigurationProps) => {
  const { data: tasks } = useGetTasksQuery({ projectId, limit: 1 });
  const [lineDirection, setLineDirection] =
    useState<DashboardConfigurationLineDirectionEnum>(
      DashboardConfigurationLineDirectionEnum.HORIZONTAL,
    );
  const [linePosition, setLinePosition] = useState(50);
  const [lineFlow, setLineFlow] = useState<DashboardConfigurationLineFlowEnum>(
    DashboardConfigurationLineFlowEnum.POSITIVE,
  );

  const isVertical =
    lineDirection === DashboardConfigurationLineDirectionEnum.VERTICAL;

  const lineStyle: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        top: 0,
        left: `${linePosition}%`,
        width: 2,
        height: "100%",
        background: "red",
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        left: 0,
        top: `${linePosition}%`,
        height: 2,
        width: "100%",
        background: "red",
        pointerEvents: "none",
      };

  return (
    <Stack>
      <Heading variant="h5" weight="600">
        Line
      </Heading>
      <Stack direction="row">
        <Stack>
          <Stack direction="row" align="center" gap={8}>
            Horizontal
            <Switch
              checked={isVertical}
              onCheckedChange={(checked) =>
                setLineDirection(
                  checked
                    ? DashboardConfigurationLineDirectionEnum.VERTICAL
                    : DashboardConfigurationLineDirectionEnum.HORIZONTAL,
                )
              }
            />
            Vertical
          </Stack>
          <NumberInput
            label="Position"
            suffix="%"
            value={linePosition}
            min={0}
            max={100}
            onChange={(e) => setLinePosition(Number(e.target.value))}
          />
          <Stack direction="row" align="center" gap={8}>
            {isVertical ? "Left to right" : "Top to bottom"}
            <Switch
              checked={lineFlow === DashboardConfigurationLineFlowEnum.NEGATIVE}
              onCheckedChange={(checked) =>
                setLineFlow(
                  checked
                    ? DashboardConfigurationLineFlowEnum.NEGATIVE
                    : DashboardConfigurationLineFlowEnum.POSITIVE,
                )
              }
            />
            {isVertical ? "Right to left" : "Bottom to top"}
          </Stack>
        </Stack>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            width={400}
            src={tasks?.data[0]?.filePath}
            alt="Task line preview"
          />
          <div style={lineStyle} />
          <FlowArrow
            isVertical={isVertical}
            isNegative={lineFlow === DashboardConfigurationLineFlowEnum.NEGATIVE}
            linePosition={linePosition}
          />
        </div>
      </Stack>
    </Stack>
  );
};
