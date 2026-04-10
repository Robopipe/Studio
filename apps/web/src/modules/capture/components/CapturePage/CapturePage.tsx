import { useListCamerasQuery } from "@/core/cameraApi";
import { NoCameraDetected, SearchingForCamera } from "@/modules/ui";
import { useState } from "react";
import { Captured } from "../Captured";
import { CaptureSettings } from "../CaptureSettings";

import { LiveCapture } from "../LiveCapture";

export interface CapturePageProps {}

export const CapturePage = ({}: CapturePageProps) => {
  const {
    data: cameras,
    isLoading,
    refetch,
    isFetching,
  } = useListCamerasQuery();

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const hasCameras = cameras && cameras.length > 0;

  if (isLoading) {
    return <SearchingForCamera />;
  }

  if (!hasCameras) {
    return <NoCameraDetected onRefresh={refetch} isRefreshing={isFetching} />;
  }

  return (
    <div className="-m-6 grid min-h-0 flex-1 grid-cols-[minmax(250px,1fr)_minmax(500px,2fr)_minmax(250px,1fr)] grid-rows-[minmax(0,1fr)] bg-white">
      <CaptureSettings
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
        onSelectCamera={setSelectedCamera}
        onSelectStream={setSelectedStream}
      />
      <LiveCapture
        selectedCamera={selectedCamera}
        selectedStream={selectedStream}
      />
      <Captured />
    </div>
  );
};
