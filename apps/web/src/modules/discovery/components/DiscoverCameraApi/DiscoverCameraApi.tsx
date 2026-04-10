import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { RadarIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { probeRobopipeApi } from "../../utils/discovery";
import { NetworkScanDialog } from "../NetworkScanDialog/NetworkScanDialog";

interface DiscoverCameraApiProps {
  onSelect: (url: string) => void;
}

export const DiscoverCameraApi = ({ onSelect }: DiscoverCameraApiProps) => {
  const [hostname, setHostname] = useState("robopipe");
  const [port, setPort] = useState("8080");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const handleDiscover = async () => {
    const portNum = Number(port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }

    const url = `http://${hostname}.local:${portNum}`;
    setIsDiscovering(true);

    try {
      const found = await probeRobopipeApi(url, 3000);
      if (found) {
        onSelect(url);
        setPopoverOpen(false);
        toast.success(`Found Robopipe API at ${url}`);
      } else {
        toast.error(
          "No Robopipe API found at this address. Try a different hostname or use Network Scan.",
        );
      }
    } catch {
      toast.error("Discovery failed. Try Network Scan instead.");
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="flex shrink-0 gap-1.5">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" />
          }
        >
          <RadarIcon data-icon="inline-start" />
          Auto Discover
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discoverHostname" className="text-xs">
                Hostname
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="discoverHostname"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  disabled={isDiscovering}
                  className="flex-1"
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  .local
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discoverPort" className="text-xs">
                Port
              </Label>
              <Input
                id="discoverPort"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isDiscovering}
              />
            </div>
            <Button
              size="sm"
              onClick={handleDiscover}
              disabled={isDiscovering || !hostname.trim()}
            >
              {isDiscovering ? (
                <>
                  <Spinner />
                  Discovering...
                </>
              ) : (
                "Discover"
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setScanOpen(true)}
      >
        <SearchIcon data-icon="inline-start" />
        Network Scan
      </Button>

      <NetworkScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onSelect={onSelect}
      />
    </div>
  );
};
