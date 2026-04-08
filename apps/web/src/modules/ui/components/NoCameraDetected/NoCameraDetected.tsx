import { EthernetIcon, NoCameraIcon } from "@/components/icons";
import { Button } from "@/modules/shadcn/ui/button";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { RefreshCw, Usb } from "lucide-react";

export interface NoCameraDetectedProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const NoCameraDetected = ({
  onRefresh,
  isRefreshing,
}: NoCameraDetectedProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 [&_svg]:size-8 [&_svg]:text-destructive">
        <NoCameraIcon />
      </div>

      <p className="mb-2 text-xl font-semibold text-black">
        No camera detected!
      </p>

      <p className="mb-6 text-sm text-black/60">
        Please make sure camera is connected to the controller.
      </p>

      <div className="mb-6 flex flex-row gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm [&_svg]:size-5 [&_svg]:text-black/60">
          <Usb />
          <span>USB</span>
          <span className="font-medium text-destructive">Not detected</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm [&_svg]:size-5 [&_svg]:text-black/60">
          <EthernetIcon />
          <span>Ethernet</span>
          <span className="font-medium text-destructive">Not detected</span>
        </div>
      </div>

      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="mb-8"
      >
        {isRefreshing ? <Spinner /> : <RefreshCw />}
        Refresh
      </Button>

      <a
        href="https://robopipe.gitbook.io/doc/getting-started/connection"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm text-primary hover:underline"
      >
        Learn more how to connect camera
      </a>
    </div>
  );
};
