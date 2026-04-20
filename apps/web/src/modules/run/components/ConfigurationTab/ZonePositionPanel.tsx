import { ZoneConfig } from "@/modules/dashboard/components/DashboardZoneConfiguration";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Switch } from "@/modules/shadcn/ui/switch";
import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";

interface ZonePositionPanelProps {
  value: ZoneConfig;
  onChange: (value: ZoneConfig) => void;
}

export const ZonePositionPanel = ({
  value,
  onChange,
}: ZonePositionPanelProps) => {
  return (
    <div className="flex w-72 shrink-0 flex-1 flex-col gap-6 p-6">
      <h2 className="text-sm font-semibold">Setup Zone</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Direction</label>
          <Select
            value={value.zoneDirection}
            onValueChange={(v) =>
              onChange({
                ...value,
                zoneDirection: v as DashboardConfigurationZoneDirectionEnum,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value={DashboardConfigurationZoneDirectionEnum.HORIZONTAL}
              >
                Horizontal
              </SelectItem>
              <SelectItem
                value={DashboardConfigurationZoneDirectionEnum.VERTICAL}
              >
                Vertical
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Zone center</label>
          <div className="relative">
            <Input
              type="number"
              value={value.zoneCenter}
              min={0}
              max={100}
              onChange={(e) =>
                onChange({ ...value, zoneCenter: Number(e.target.value) })
              }
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Zone thickness</label>
          <div className="relative">
            <Input
              type="number"
              value={value.zoneThickness}
              min={0}
              max={100}
              onChange={(e) =>
                onChange({ ...value, zoneThickness: Number(e.target.value) })
              }
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="run-zone-optimistic"
            checked={value.optimistic}
            onCheckedChange={(checked) =>
              onChange({ ...value, optimistic: checked })
            }
          />
          <Label
            htmlFor="run-zone-optimistic"
            className="text-sm text-muted-foreground"
          >
            Optimistic
          </Label>
        </div>
      </div>
    </div>
  );
};
