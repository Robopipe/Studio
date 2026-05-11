import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { Label } from "@/modules/shadcn/ui/label";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { Switch } from "@/modules/shadcn/ui/switch";
import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import { DirectionPicker } from "./DirectionPicker";
import {
  ZoneArrow,
  centerThicknessToSafeBounds,
  getSafeZoneStyles,
  safeBoundsToCenterThickness,
  safeZoneLabels,
} from "./zonePreview";

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
  // (converted to 0-1 at save time). The form exposes safe-zone bounds
  // (start/end) instead of center/thickness, but the underlying stored
  // shape stays the same for backend compatibility.
  const { safeStartPct, safeEndPct } = centerThicknessToSafeBounds(
    value.zoneCenter,
    value.zoneThickness,
  );
  const labels = safeZoneLabels(value.zoneDirection);
  const safeStyles = getSafeZoneStyles(
    value.zoneDirection,
    safeStartPct,
    safeEndPct,
  );

  const applySafeBounds = (nextStart: number, nextEnd: number) => {
    const { centerPct, thicknessPct } = safeBoundsToCenterThickness(
      nextStart,
      nextEnd,
    );
    onChange({
      ...value,
      zoneCenter: centerPct,
      zoneThickness: thicknessPct,
    });
  };

  const setSafeStart = (next: number | null) => {
    const s = Math.max(0, Math.min(100, next ?? 0));
    const e = Math.min(safeEndPct, 100 - s);
    applySafeBounds(s, e);
  };

  const setSafeEnd = (next: number | null) => {
    const e = Math.max(0, Math.min(100, next ?? 0));
    const s = Math.min(safeStartPct, 100 - e);
    applySafeBounds(s, e);
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
            <DirectionPicker
              value={value.zoneDirection}
              onChange={(zoneDirection) =>
                onChange({ ...value, zoneDirection })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              {labels.start}
            </Label>
            <div className="flex items-center gap-2">
              <NumberInput
                className="w-24"
                value={safeStartPct}
                min={0}
                max={100}
                onValueChange={setSafeStart}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              {labels.end}
            </Label>
            <div className="flex items-center gap-2">
              <NumberInput
                className="w-24"
                value={safeEndPct}
                min={0}
                max={100}
                onValueChange={setSafeEnd}
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
          <div style={safeStyles.start} />
          <div style={safeStyles.end} />
          <ZoneArrow
            direction={value.zoneDirection}
            centerPct={value.zoneCenter}
          />
        </div>
      </div>
    </div>
  );
};
