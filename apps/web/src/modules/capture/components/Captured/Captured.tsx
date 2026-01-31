import { Tabs } from "@repo/ui";

import { CapturedPhotos } from "../CapturedPhotos";
import { CapturedVideos } from "../CapturedVideos";

import styles from "./Captured.module.scss";

export interface CapturedProps {}

export const Captured = ({}: CapturedProps) => {
  return (
    <Tabs
      tabs={[
        { label: "Captured photos", render: () => <CapturedPhotos /> },
        {
          label: "Captured videos",
          render: () => <CapturedVideos />,
        },
      ]}
      defaultValue="Captured photos"
      className={styles.captured}
    />
  );
};
