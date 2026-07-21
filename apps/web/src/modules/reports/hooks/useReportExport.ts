import {
  cameraApi,
  useCreateReportMutation,
  useDeleteReportMutation,
} from "@/core/cameraApi";
import type { CreateReportRequest } from "@/core/cameraApi/schemas/report";
import { useAppDispatch } from "@/hooks/redux";
import { useCameraApiUrl } from "@/hooks/useCameraApiUrl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  parseContentDispositionFilename,
  triggerBlobDownload,
} from "../utils/download";

const POLL_INTERVAL_MS = 3000;
const POLL_DEADLINE_MS = 120_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs the full report-export transaction: create the job, poll until it
 * settles, download the resulting ZIP, and delete the job afterwards —
 * reports are treated as ephemeral export artifacts, not stored documents.
 */
export function useReportExport(dashboardId: number | null) {
  const dispatch = useAppDispatch();
  const cameraApiUrl = useCameraApiUrl();
  const [createReport] = useCreateReportMutation();
  const [deleteReport] = useDeleteReportMutation();
  const [isExporting, setIsExporting] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const exportReport = useCallback(
    async (request: CreateReportRequest) => {
      if (dashboardId === null || !cameraApiUrl || isExporting) return;

      setIsExporting(true);
      let reportId: number | null = null;
      try {
        const summary = await createReport({
          dashboardId,
          ...request,
        }).unwrap();
        reportId = summary.id;

        let status = summary.status;
        let jobError = summary.error;
        const deadline = Date.now() + POLL_DEADLINE_MS;
        while (
          (status === "pending" || status === "running") &&
          mountedRef.current
        ) {
          if (Date.now() > deadline) {
            throw new Error("timed out waiting for the report");
          }
          await sleep(POLL_INTERVAL_MS);
          const reports = await dispatch(
            cameraApi.endpoints.listReports.initiate(
              { dashboardId },
              { subscribe: false, forceRefetch: true },
            ),
          ).unwrap();
          const current = reports.find((report) => report.id === summary.id);
          if (!current) {
            throw new Error("report disappeared before completing");
          }
          status = current.status;
          jobError = current.error;
        }
        if (!mountedRef.current) return;

        if (status === "failed") {
          toast.error(`Export failed: ${jobError ?? "unknown error"}`);
          return;
        }

        const response = await fetch(
          `${cameraApiUrl}/dashboard/${dashboardId}/report/${summary.id}`,
        );
        if (!response.ok) {
          throw new Error(`download failed (${response.status})`);
        }
        const blob = await response.blob();
        const filename =
          parseContentDispositionFilename(
            response.headers.get("content-disposition"),
          ) ?? `report-${summary.id}.zip`;
        triggerBlobDownload(blob, filename);
        toast.success("Report downloaded");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Export failed: ${error.message}`
            : "Export failed",
        );
      } finally {
        if (reportId !== null) {
          deleteReport({ dashboardId, reportId })
            .unwrap()
            .catch(() => {
              // Cleanup is best-effort; a leftover report is harmless.
            });
        }
        if (mountedRef.current) setIsExporting(false);
      }
    },
    [
      dashboardId,
      cameraApiUrl,
      isExporting,
      createReport,
      deleteReport,
      dispatch,
    ],
  );

  return { exportReport, isExporting };
}
