import { Button } from "@/modules/shadcn/ui/button";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { NetworkScanDialog } from "../NetworkScanDialog/NetworkScanDialog";

interface DiscoverCameraApiProps {
  onSelect: (url: string) => void;
}

export const DiscoverCameraApi = ({ onSelect }: DiscoverCameraApiProps) => {
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="h-11"
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
    </>
  );
};
