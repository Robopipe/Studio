import { cameraApi } from "@/core/cameraApi";
import { CameraApiTagType } from "@/core/cameraApi/tagType";
import { bumpPipeline } from "@/modules/camera-stream/services/cameraPipelineGenerationSlice";
import { LayoutDashboard } from "lucide-react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export interface DashboardRuntimePageProps {
  configId: number;
  dashboardUrl: string | null;
}

export const DashboardRuntimePage = ({
  dashboardUrl,
}: DashboardRuntimePageProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!dashboardUrl || event.origin !== new URL(dashboardUrl).origin) {
        return;
      }

      if (event.data?.type === "MODEL_DEPLOYED") {
        const { mxid, streamName } = event.data.data;
        dispatch(
          cameraApi.util.invalidateTags([
            { type: CameraApiTagType.Replay, id: `${mxid}-${streamName}` },
            { type: CameraApiTagType.NN, id: `${mxid}-${streamName}` },
            { type: CameraApiTagType.Dashboard, id: `${mxid}-${streamName}` },
            { type: CameraApiTagType.Streams, id: mxid },
          ]),
        );
        dispatch(bumpPipeline({ mxid, streamName }));
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [dashboardUrl]);

  if (dashboardUrl) {
    return (
      <iframe
        src={dashboardUrl}
        className="-m-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] border-none"
        allow="screen-wake-lock"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/5 [&_svg]:size-7 [&_svg]:text-black/30">
        <LayoutDashboard />
      </div>
      <p className="mb-2 text-base text-black/85">Dashboard is not running</p>
      <p className="max-w-[360px] text-center text-sm text-black/45">
        Configure your setup and click Deploy in the tab bar to start the
        dashboard.
      </p>
    </div>
  );
};
