import { useListCamerasQuery } from "@/core/cameraApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Camera } from "lucide-react";
import { useEffect } from "react";

export interface SelectCameraProps {
  value?: string | null;
  onSelect: (mxid: string | null) => void;
}

export const SelectCamera = ({ value, onSelect }: SelectCameraProps) => {
  const { data: cameras } = useListCamerasQuery();

  // Auto-select the first camera as soon as the list arrives if nothing is
  // currently picked or the saved value no longer exists in the list.
  useEffect(() => {
    if (!cameras || cameras.length === 0) return;
    if (!value || !cameras.some((c) => c.mxid === value)) {
      onSelect(cameras[0].mxid);
    }
  }, [cameras, value, onSelect]);

  return (
    <Select value={value ?? undefined} onValueChange={(val) => onSelect(val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select camera">
          {(mxid: string) => {
            const camera = cameras?.find((c) => c.mxid === mxid);
            return (
              <span className="flex items-center gap-2">
                <Camera className="size-4" />
                {camera?.camera_name ?? mxid}
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {cameras?.map((camera) => (
          <SelectItem key={camera.mxid} value={camera.mxid}>
            <span className="flex items-center gap-2">
              <Camera className="size-4" />
              {camera.camera_name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
