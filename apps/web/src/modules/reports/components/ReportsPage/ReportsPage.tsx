import {
  useCreateReportMutation,
  useDeleteReportMutation,
  useGetDashboardQuery,
  useListCamerasQuery,
  useListReportsQuery,
} from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { useSelectedCameraStream } from "@/modules/camera-selection";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { ModelRunning, NoCameraDetected } from "@/modules/ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { downloadReport } from "../../utils/downloadReport";
import { hasInflightReports } from "../../utils/hasInflightReports";
import { CreateReportForm } from "../CreateReportForm";
import { DeleteReportDialog } from "../DeleteReportDialog";
import { ReportListItem } from "../ReportListItem";

export interface ReportsPageProps {
  dashboardId: number;
  projectId: number;
}

export const ReportsPage = ({ dashboardId, projectId }: ReportsPageProps) => {
  const { url: cameraApiUrl } = useCameraApiUrl();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState(0);

  const { data: cameras } = useListCamerasQuery(undefined, {
    skip: !cameraApiUrl,
  });
  const { cameraMxid: selectedCamera, streamName: selectedStream } =
    useSelectedCameraStream(cameras);
  const { isSuccess: isModelRunning } = useGetDashboardQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );

  const {
    data: reports = [],
    refetch,
    isFetching,
    isError,
    isSuccess,
  } = useListReportsQuery(
    { dashboardId },
    {
      skip: !cameraApiUrl,
      pollingInterval,
      skipPollingIfUnfocused: true,
    },
  );

  const inflight = hasInflightReports(reports);
  useEffect(() => {
    setPollingInterval(inflight ? 3000 : 0);
  }, [inflight]);

  const [createReport, { isLoading: isCreating }] = useCreateReportMutation();
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  if (!cameraApiUrl || isError) {
    return <NoCameraDetected onRefresh={refetch} isRefreshing={isFetching} />;
  }

  if (isModelRunning) {
    return (
      <ModelRunning
        projectId={projectId}
        message="You cannot use reports while a model is running. Disable it first."
        hideButton
      />
    );
  }

  if (!isSuccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <Spinner className="size-10 text-black/60" />
        <p className="text-sm text-black/60">Loading reports…</p>
      </div>
    );
  }

  const handleCreate = async (params: {
    start: string | null;
    end: string | null;
  }) => {
    try {
      await createReport({
        dashboardId,
        start: params.start,
        end: params.end,
      }).unwrap();
    } catch (err: any) {
      const data = err?.data;
      const serverMessage =
        typeof data === "string"
          ? data
          : data?.detail || data?.message || data?.error;
      toast.error(serverMessage || "Failed to create report");
      throw err;
    }
  };

  const handleDownload = async (reportId: number) => {
    setDownloadingId(reportId);
    try {
      await downloadReport(cameraApiUrl, dashboardId, reportId);
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    try {
      await deleteReport({ dashboardId, reportId: pendingDeleteId }).unwrap();
      setPendingDeleteId(null);
    } catch {
      toast.error("Failed to delete report");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <CreateReportForm onSubmit={handleCreate} isSubmitting={isCreating} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between">
          <span className="text-sm font-bold">Existing reports</span>
        </div>

        {reports.length === 0 ? (
          <span className="text-sm text-black/60">No reports yet.</span>
        ) : (
          <div className="flex flex-col gap-2">
            {reports.map((report) => (
              <ReportListItem
                key={report.id}
                report={report}
                onDownload={() => handleDownload(report.id)}
                onDelete={() => setPendingDeleteId(report.id)}
                isDownloading={downloadingId === report.id}
                isDeleting={isDeleting && pendingDeleteId === report.id}
              />
            ))}
          </div>
        )}
      </div>

      {pendingDeleteId !== null && (
        <DeleteReportDialog
          reportId={pendingDeleteId}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
