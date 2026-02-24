import { useListCamerasQuery } from "@/core/cameraApi";
import { DashboardPage } from "@/modules/dashboard";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { Stack } from "@repo/ui";
import { useState } from "react";
import { LiveInference } from "../LiveInference";
import { RunSidebar } from "../RunSidebar";
import { RunSubheader, RunTab } from "../RunSubheader";
import styles from "./RunPage.module.scss";

export const RunPage = () => {
  const [activeTab, setActiveTab] = useState<RunTab>("inference");

  return (
    <Stack className={styles.pageWrapper} gap={0}>
      <RunSubheader activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "inference" && <InferenceContent />}
      {activeTab === "dashboard" && <DashboardPage />}
    </Stack>
  );
};

const InferenceContent = () => {
  const {
    data: cameras,
    isLoading,
    refetch,
    isFetching,
  } = useListCamerasQuery();

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
  );
};
