import { LineConfig } from "@/modules/dashboard/components/DashboardLineConfiguration";
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
  const rotate = isVertical ? (isNegative ? 90 : 270) : isNegative ? 180 : 0;

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

interface CameraPreviewProps {
  imageUrl: string | undefined;
  lineConfig: LineConfig;
}

export const CameraPreview = ({ imageUrl, lineConfig }: CameraPreviewProps) => {
  const isVertical =
    lineConfig.lineDirection ===
    DashboardConfigurationLineDirectionEnum.VERTICAL;

  const lineStyle: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        top: 0,
        left: `${lineConfig.linePosition}%`,
        width: 2,
        height: "100%",
        background: "#ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        left: 0,
        top: `${lineConfig.linePosition}%`,
        height: 2,
        width: "100%",
        background: "#ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      };

  return (
    <div className="relative flex-1 overflow-hidden m-8 rounded-xl">
      <img
        className="block h-full w-full object-cover"
        src={imageUrl}
        alt="Camera preview"
      />
      <div style={lineStyle} />
      <FlowArrow
        isVertical={isVertical}
        isNegative={
          lineConfig.lineFlow === DashboardConfigurationLineFlowEnum.NEGATIVE
        }
        linePosition={lineConfig.linePosition}
      />
    </div>
  );
};
