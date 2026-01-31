import { useListCamerasQuery } from "@/core/cameraApi";
import { CameraIcon } from "@repo/ui";
import { Select } from "@repo/ui/components/Select/Select";
import { useEffect } from "react";
import styles from "./SelectCamera.module.scss";

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
    <Select<string>
      placeholder="Select camera"
      items={
        cameras?.map((camera) => ({
          label: (
            <span className={styles.selectItem}>
              <CameraIcon />
              {camera.camera_name}
            </span>
          ),
          value: camera.mxid,
        })) || []
      }
      value={value}
      onValueChange={(value) => onSelect(value)}
    />
  );
};
