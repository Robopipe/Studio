import { Button } from "@/modules/shadcn/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { useState } from "react";
import { toast } from "sonner";
import { useNetworkScan } from "../../hooks/useNetworkScan";
import { DeviceList } from "../DeviceList/DeviceList";

const PRESET_RANGES = [
  { label: "10.0.0.0/8", value: "10.0.0.0/8" },
  { label: "172.16.0.0/12", value: "172.16.0.0/12" },
  { label: "192.168.0.0/16", value: "192.168.0.0/16" },
] as const;

interface NetworkScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export const NetworkScanDialog = ({
  open,
  onOpenChange,
  onSelect,
}: NetworkScanDialogProps) => {
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [ports, setPorts] = useState("8080");
  const [hostname, setHostname] = useState("robopipe");

  const { scan, cancel, results, isScanning, progress } = useNetworkScan();
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    try {
      await scan(cidr, ports, hostname);
      setHasScanned(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    }
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
    toast.success(`Selected ${url}`);
  };

  const handleClose = (nextOpen: boolean) => {
    if (isScanning) cancel();
    setHasScanned(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Network Scan</DialogTitle>
          <DialogDescription>
            Scan a network range for Robopipe API instances.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cidr">IP Range (CIDR)</Label>
            <div className="flex flex-row gap-2">
              <Input
                id="cidr"
                placeholder="192.168.1.0/24"
                value={cidr}
                onChange={(e) => {
                  setCidr(e.target.value);
                }}
                disabled={isScanning}
                className="flex-1"
              />
              <Select
                value={
                  PRESET_RANGES.some((r) => r.value === cidr) ? cidr : undefined
                }
                onValueChange={(val) => setCidr(val as string)}
                disabled={isScanning}
              >
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scanPorts">Port(s)</Label>
            <Input
              id="scanPorts"
              placeholder="8080"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              disabled={isScanning}
            />
            <p className="text-xs text-muted-foreground">
              Single port (e.g. 8080) or range (e.g. 8080-8090)
            </p>
          </div>

          <Collapsible>
            <CollapsibleTrigger>Advanced Options</CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="flex flex-col gap-1.5 px-1 pb-1">
                <Label htmlFor="mdnsHostname" className="text-xs">
                  mDNS Hostname
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="mdnsHostname"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    disabled={isScanning}
                    className="flex-1"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    .local
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Before scanning the network, the app will try to reach this
                  hostname via mDNS.
                </p>
              </div>
            </CollapsiblePanel>
          </Collapsible>

          {isScanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>
                {progress.phase === "mdns"
                  ? "Trying mDNS discovery..."
                  : `Scanning... ${progress.scanned}/${progress.total}`}
              </span>
            </div>
          )}

          {hasScanned && !isScanning && (
            <DeviceList devices={results} onSelect={handleSelect} />
          )}
        </div>

        <DialogFooter>
          {isScanning ? (
            <Button variant="destructive" onClick={cancel}>
              Cancel
            </Button>
          ) : (
            <Button onClick={handleScan}>Scan</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
