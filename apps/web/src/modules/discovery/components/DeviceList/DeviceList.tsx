import { Button } from "@/modules/shadcn/ui/button";
import { DiscoveredDevice } from "../../types";

interface DeviceListProps {
  devices: DiscoveredDevice[];
  onSelect: (url: string) => void;
}

export const DeviceList = ({ devices, onSelect }: DeviceListProps) => {
  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No devices found in the specified range.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {devices.map((device) => (
        <div
          key={device.url}
          className="flex items-center justify-between rounded-md border border-border p-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{device.host}</span>
            <span className="text-xs text-muted-foreground">
              Port {device.port}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(device.url)}
          >
            Select
          </Button>
        </div>
      ))}
    </div>
  );
};
