import { Spinner } from "@/modules/shadcn/ui/spinner";
import { Camera } from "lucide-react";

export const SearchingForCamera = () => {
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
    </div>
  );
};
