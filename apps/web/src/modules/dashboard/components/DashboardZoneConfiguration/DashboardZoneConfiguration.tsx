import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Switch } from "@/modules/shadcn/ui/switch";
import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import { DirectionPicker } from "./DirectionPicker";
import { ZoneArrow, getZoneStyle } from "./zonePreview";

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

  // UI uses 0-100 for display; ZoneConfig backing values are 0-100 too
  // (converted to 0-1 at save time)
  const centerPct = value.zoneCenter;
  const thicknessPct = value.zoneThickness;

  return (
    <div className="flex flex-col gap-3">
      <h5 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
        Zone
      </h5>

      <div className="flex gap-6">
        <div className="flex shrink-0 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">Direction</Label>
            <DirectionPicker
              value={value.zoneDirection}
              onChange={(zoneDirection) =>
                onChange({ ...value, zoneDirection })
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
          <div
            style={getZoneStyle(value.zoneDirection, centerPct, thicknessPct)}
          />
          <ZoneArrow
            direction={value.zoneDirection}
            centerPct={centerPct}
          />
        </div>
      </div>
    </div>
  );
};
