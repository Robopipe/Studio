import { useListCamerasQuery } from "@/core/cameraApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Camera } from "lucide-react";
import { useEffect, useMemo } from "react";

export interface SelectCameraProps {
  value?: string | null;
  onSelect: (mxid: string | null) => void;
  /**
   * Guard for user-initiated changes (not the auto-select effect). Resolving
   * false swallows the change; the controlled `value` keeps the old selection.
   */
  onBeforeUserSelect?: () => Promise<boolean>;
}

export const SelectCamera = ({
  value,
  onSelect,
  onBeforeUserSelect,
}: SelectCameraProps) => {
  const { data: cameras } = useListCamerasQuery();

  const cameraItems = useMemo(
    () =>
      cameras?.reduce(
        (acc, camera) => ({ ...acc, [camera.mxid]: camera.camera_name }),
        {} as Record<string, string>,
      ),
    [cameras],
  );

  useEffect(() => {
    if (!cameras || cameras.length === 0) return;
    if (!value || !cameras.some((c) => c.mxid === value)) {
      onSelect(cameras[0].mxid);
    }
  }, [cameras, value, onSelect]);

  return (
    <Select
      value={value}
      onValueChange={async (val) => {
        if (val === value) return;
        if (onBeforeUserSelect && !(await onBeforeUserSelect())) return;
        onSelect(val);
      }}
      items={cameraItems}
    >
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
