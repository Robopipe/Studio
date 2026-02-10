import { useListCamerasQuery } from "@/core/cameraApi";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { Stack } from "@repo/ui";
import { useState } from "react";
import { LiveInference } from "../LiveInference";
import { RunSidebar } from "../RunSidebar";
import { RunSubheader } from "../RunSubheader";
import styles from "./RunPage.module.scss";

export const RunPage = () => {
  const { data: cameras, isLoading, refetch, isFetching } = useListCamerasQuery();

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);

  const hasCameras = cameras && cameras.length > 0;

  if (isLoading) {
    return <SearchingForCamera />;
  }

  if (!hasCameras) {
    return <NoCameraDetected onRefresh={refetch} isRefreshing={isFetching} />;
  }

  return (
    <Stack className={styles.pageWrapper}>
      <RunSubheader />
      <div className={styles.page}>
        <RunSidebar
          selectedCamera={selectedCamera}
          selectedStream={selectedStream}
          selectedModelId={selectedModelId}
          selectedOutputId={selectedOutputId}
          onSelectCamera={(camera) => {
            setSelectedCamera(camera);
            setSelectedStream(null);
          }}
          onSelectStream={setSelectedStream}
          onSelectModel={setSelectedModelId}
          onSelectOutput={setSelectedOutputId}
        />
        <LiveInference
          selectedCamera={selectedCamera}
          selectedStream={selectedStream}
          selectedModelId={selectedModelId}
          selectedOutputId={selectedOutputId}
        />
      </div>
    </Stack>
  );
};
