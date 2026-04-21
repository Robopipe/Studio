import { ZoneConfig } from "@/modules/dashboard/components/DashboardZoneConfiguration";
import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import React from "react";

interface CameraPreviewProps {
  imageUrl: string | undefined;
  zoneConfig: ZoneConfig;
}

export const CameraPreview = ({ imageUrl, zoneConfig }: CameraPreviewProps) => {
  const isVertical =
    zoneConfig.zoneDirection ===
    DashboardConfigurationZoneDirectionEnum.VERTICAL;

  const centerPct = zoneConfig.zoneCenter;
  const thicknessPct = zoneConfig.zoneThickness;

  const zoneStyle: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        top: 0,
        left: `${centerPct - thicknessPct / 2}%`,
        width: `${thicknessPct}%`,
        height: "100%",
        background: "rgba(239, 68, 68, 0.35)",
        border: "1px solid #ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        left: 0,
        top: `${centerPct - thicknessPct / 2}%`,
        height: `${thicknessPct}%`,
        width: "100%",
        background: "rgba(239, 68, 68, 0.35)",
        border: "1px solid #ef4444",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      };

  return (
    <div className="relative m-6 flex-1 self-center overflow-hidden rounded-xl aspect-video">
      <img
        className="block h-full w-full object-cover"
        src={imageUrl}
        alt="Camera preview"
      />
      <div style={zoneStyle} />
    </div>
  );
};
