import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Switch } from "@/modules/shadcn/ui/switch";
import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import React from "react";

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

export interface ZoneConfig {
  zoneDirection: DashboardConfigurationZoneDirectionEnum;
  zoneCenter: number;
  zoneThickness: number;
  optimistic: boolean;
}

export interface DashboardZoneConfigurationProps {
  projectId: number;
  value: ZoneConfig;
  onChange: (value: ZoneConfig) => void;
}

export const DashboardZoneConfiguration = ({
  projectId,
  value,
  onChange,
}: DashboardZoneConfigurationProps) => {
  const { data: tasks } = useGetTasksQuery({ projectId, limit: 1 });

  const isVertical =
    value.zoneDirection === DashboardConfigurationZoneDirectionEnum.VERTICAL;

  // UI uses 0-100 for display; ZoneConfig backing values are 0-100 too
  // (converted to 0-1 at save time)
  const centerPct = value.zoneCenter;
  const thicknessPct = value.zoneThickness;

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
    <div className="flex flex-col gap-3">
      <h5 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
        Zone
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
                  zoneDirection:
                    v === 1
                      ? DashboardConfigurationZoneDirectionEnum.VERTICAL
                      : DashboardConfigurationZoneDirectionEnum.HORIZONTAL,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Zone center</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-24"
                value={centerPct}
                min={0}
                max={100}
                onChange={(e) =>
                  onChange({ ...value, zoneCenter: Number(e.target.value) })
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              Zone thickness
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-24"
                value={thicknessPct}
                min={0}
                max={100}
                onChange={(e) =>
                  onChange({ ...value, zoneThickness: Number(e.target.value) })
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="zone-optimistic"
              checked={value.optimistic}
              onCheckedChange={(checked) =>
                onChange({ ...value, optimistic: checked })
              }
            />
            <Label
              htmlFor="zone-optimistic"
              className="text-sm text-muted-foreground"
            >
              Optimistic
            </Label>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-md border border-border">
          <img
            className="block h-auto max-h-60 w-auto max-w-90 object-contain"
            src={tasks?.data[0]?.filePath}
            alt="Task zone preview"
          />
          <div style={zoneStyle} />
        </div>
      </div>
    </div>
  );
};
