import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Camera } from "lucide-react";

export interface SearchingForCameraProps {
  url?: string | null;
  isOverride?: boolean;
}

export const SearchingForCamera = ({
  url,
  isOverride,
}: SearchingForCameraProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
        <Camera className="size-8 text-black/60" />
      </div>

      <p className="mb-2 text-xl font-semibold text-black">
        Searching for camera...
      </p>

      <p className="mb-6 text-sm text-black/60">
        Please make sure camera is connected to the controller.
      </p>

      <Spinner />

      {url && (
        <p className="mt-6 font-mono text-xs text-black/40">
          Trying: {url}
          {isOverride && (
            <span className="ml-1 text-black/50">(local override)</span>
          )}
        </p>
      )}
    </div>
  );
};
