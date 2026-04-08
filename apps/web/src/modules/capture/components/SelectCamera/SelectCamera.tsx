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

  useEffect(() => {
    // Select first camera automatically
    if (cameras && cameras.length > 0 && !value) {
      onSelect(cameras[0].mxid);
    }
  }, [cameras]);

  return (
    <Select value={value ?? undefined} onValueChange={(val) => onSelect(val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select camera" />
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
