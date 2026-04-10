import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { useState } from "react";
import { toast } from "sonner";
import { useNetworkScan } from "../../hooks/useNetworkScan";
import { isValidIpv4 } from "../../utils/discovery";
import { DeviceList } from "../DeviceList/DeviceList";

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
  const [startIp, setStartIp] = useState("192.168.1.1");
  const [endIp, setEndIp] = useState("192.168.1.254");
  const [port, setPort] = useState("8080");

  const { scan, cancel, results, isScanning, progress } = useNetworkScan();
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    if (!isValidIpv4(startIp)) {
      toast.error("Invalid start IP address");
      return;
    }
    if (!isValidIpv4(endIp)) {
      toast.error("Invalid end IP address");
      return;
    }
    const portNum = Number(port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }

    try {
      await scan(startIp, endIp, portNum);
      setHasScanned(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Scan failed",
      );
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
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="startIp">Start IP</Label>
              <Input
                id="startIp"
                value={startIp}
                onChange={(e) => setStartIp(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="endIp">End IP</Label>
              <Input
                id="endIp"
                value={endIp}
                onChange={(e) => setEndIp(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <div className="flex w-24 flex-col gap-1.5">
              <Label htmlFor="scanPort">Port</Label>
              <Input
                id="scanPort"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isScanning}
              />
            </div>
          </div>

          {isScanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>
                Scanning... {progress.scanned}/{progress.total}
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
