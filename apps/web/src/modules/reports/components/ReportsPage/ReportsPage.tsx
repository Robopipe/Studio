import { useListEventsQuery, useListSessionsQuery } from "@/core/cameraApi";
import type { EventListItem } from "@/core/cameraApi/schemas/events";
import { useCameraApiUrl } from "@/hooks/useCameraApiUrl";
import { cn } from "@/lib/utils";
import { useGetEvalTestCasesQuery } from "@/modules/evaluation";
import { Button } from "@/modules/shadcn/ui/button";
import type { DateTimeRange } from "@/modules/shadcn/ui/date-time-range-picker";
import { TooltipProvider } from "@/modules/shadcn/ui/tooltip";
import { DataTable } from "@/modules/ui/components/Table";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReportExport } from "../../hooks/useReportExport";
import { ReportDetailPanel } from "../ReportDetailPanel";
import {
  ALL_SESSIONS,
  ReportsToolbar,
  type PassedFilter,
} from "../ReportsToolbar";
import {
  SORT_KEY_BY_COLUMN,
  useReportColumns,
  type ReportColumnFilters,
} from "./useReportColumns";

const PAGE_SIZE = 20;
const EVENTS_POLL_INTERVAL_MS = 5000;

interface ReportsPageProps {
  dashboardId: number | null;
  projectId: number | null;
}

export const ReportsPage = ({ dashboardId, projectId }: ReportsPageProps) => {
  const [sessionId, setSessionId] = useState<string>(ALL_SESSIONS);
  const [range, setRange] = useState<DateTimeRange>({});
  const [passedFilter, setPassedFilter] = useState<PassedFilter>("all");
  const [testCaseIds, setTestCaseIds] = useState<string[]>([]);
  const [limitIds, setLimitIds] = useState<string[]>([]);
  // Scopes the export only; the column-header filters never reach the export.
  const [exportFrom, setExportFrom] = useState<Date | undefined>(undefined);
  const [exportTo, setExportTo] = useState<Date | undefined>(undefined);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  // Mirrors the server default (timestamp desc).
  const [sorting, setSorting] = useState<SortingState>([
    { id: "detectedAt", desc: true },
  ]);
  const [checkedEventId, setCheckedEventId] = useState<number | null>(null);
  // Lags behind checkedEventId so the panel stays mounted while it collapses.
  const [renderedEventId, setRenderedEventId] = useState<number | null>(null);

  const { url: cameraApiUrl } = useCameraApiUrl();
  const { exportReport, isExporting } = useReportExport(dashboardId);

  // Filters reset paging and selection; a new dashboard resets everything.
  useEffect(() => {
    setSessionId(ALL_SESSIONS);
    setRange({});
    setPassedFilter("all");
    setTestCaseIds([]);
    setLimitIds([]);
    setExportFrom(undefined);
    setExportTo(undefined);
    setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
    setCheckedEventId(null);
    setRenderedEventId(null);
  }, [dashboardId]);

  useEffect(() => {
    if (checkedEventId !== null) {
      setRenderedEventId(checkedEventId);
    }
  }, [checkedEventId]);

  const resetPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSessionChange = useCallback(
    (value: string) => {
      setSessionId(value);
      resetPage();
    },
    [resetPage],
  );

  const handleRangeChange = useCallback(
    (value: DateTimeRange) => {
      setRange(value);
      resetPage();
    },
    [resetPage],
  );

  const handleTestCaseIdsChange = useCallback(
    (ids: string[]) => {
      setTestCaseIds(ids);
      resetPage();
    },
    [resetPage],
  );

  const handleLimitIdsChange = useCallback(
    (ids: string[]) => {
      setLimitIds(ids);
      resetPage();
    },
    [resetPage],
  );

  const handlePassedFilterChange = useCallback(
    (value: PassedFilter) => {
      setPassedFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [],
  );

  const filterArgs = useMemo(
    () => ({
      sessionId: sessionId !== ALL_SESSIONS ? Number(sessionId) : undefined,
      // The range picker owns time-of-day defaults (00:00 / 23:59:59.999).
      start: range.from?.toISOString(),
      end: range.to?.toISOString(),
      passed: passedFilter === "all" ? undefined : passedFilter === "passed",
      testCaseIds: testCaseIds.length > 0 ? testCaseIds : undefined,
      limitIds: limitIds.length > 0 ? limitIds : undefined,
    }),
    [sessionId, range, passedFilter, testCaseIds, limitIds],
  );

  const eventArgs = useMemo(
    () => ({
      dashboardId: dashboardId!,
      ...filterArgs,
      sortBy: sorting[0] ? SORT_KEY_BY_COLUMN[sorting[0].id] : undefined,
      order: sorting[0]
        ? sorting[0].desc
          ? ("desc" as const)
          : ("asc" as const)
        : undefined,
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [dashboardId, filterArgs, sorting, pagination],
  );

  const { data: sessions = [] } = useListSessionsQuery(
    { dashboardId: dashboardId! },
    { skip: dashboardId === null },
  );

  // Filter options come from the eval config — the dashboard id doubles as
  // the studio config id (see RunPage), and events reference the same
  // test-case/limit ids the deploy payload carries.
  const { data: testCases = [] } = useGetEvalTestCasesQuery(
    { projectId: projectId!, configId: dashboardId! },
    { skip: projectId === null || dashboardId === null },
  );

  const {
    data: events,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListEventsQuery(eventArgs, {
    skip: dashboardId === null,
    pollingInterval: EVENTS_POLL_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });

  const handleCheck = useCallback((event: EventListItem) => {
    setCheckedEventId(event.id);
  }, []);

  // Prev/next steps through the rows of the currently loaded page.
  const checkedIndex = useMemo(
    () =>
      checkedEventId === null
        ? -1
        : (events?.items ?? []).findIndex((item) => item.id === checkedEventId),
    [events, checkedEventId],
  );
  const hasPrev = checkedIndex > 0;
  const hasNext =
    checkedIndex !== -1 && checkedIndex < (events?.items.length ?? 0) - 1;

  const handlePrev = useCallback(() => {
    const prev = events?.items[checkedIndex - 1];
    if (prev) setCheckedEventId(prev.id);
  }, [events, checkedIndex]);

  const handleNext = useCallback(() => {
    const next = events?.items[checkedIndex + 1];
    if (next) setCheckedEventId(next.id);
  }, [events, checkedIndex]);

  const getPictureUrl = useCallback(
    (event: EventListItem) =>
      `${cameraApiUrl}/dashboard/${dashboardId}/events/${event.id}/picture`,
    [cameraApiUrl, dashboardId],
  );

  const handleExport = useCallback(() => {
    // The export is scoped only by the toolbar date range — the column-header
    // filters intentionally don't apply to it.
    void exportReport({
      start: exportFrom ? startOfDay(exportFrom).toISOString() : undefined,
      end: exportTo ? endOfDay(exportTo).toISOString() : undefined,
    });
  }, [exportReport, exportFrom, exportTo]);

  const columnFilters = useMemo<ReportColumnFilters>(
    () => ({
      range,
      onRangeChange: handleRangeChange,
      passed: passedFilter,
      onPassedChange: handlePassedFilterChange,
      testCaseIds,
      onTestCaseIdsChange: handleTestCaseIdsChange,
      limitIds,
      onLimitIdsChange: handleLimitIdsChange,
      testCases,
    }),
    [
      range,
      handleRangeChange,
      passedFilter,
      handlePassedFilterChange,
      testCaseIds,
      handleTestCaseIdsChange,
      limitIds,
      handleLimitIdsChange,
      testCases,
    ],
  );

  const columns = useReportColumns({
    onCheck: handleCheck,
    getPictureUrl,
    filters: columnFilters,
  });

  if (dashboardId === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        No dashboard configuration selected — create one in the Control tab to
        collect evaluation records.
      </div>
    );
  }

  return (
    <TooltipProvider delay={400}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h5 className="text-xl font-semibold">All Test Cases</h5>
          <ReportsToolbar
            sessions={sessions}
            sessionId={sessionId}
            onSessionChange={handleSessionChange}
            exportFrom={exportFrom}
            onExportFromChange={setExportFrom}
            exportTo={exportTo}
            onExportToChange={setExportTo}
            onRefresh={refetch}
            isRefreshing={isFetching}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            {isError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                Failed to load evaluation records — is the camera API reachable?
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <DataTable
                data={events?.items ?? []}
                columns={columns}
                isLoading={isLoading}
                manualPagination
                pagination={pagination}
                onPaginationChange={setPagination}
                rowCount={events?.total ?? 0}
                manualSorting
                sorting={sorting}
                onSortingChange={handleSortingChange}
                getRowId={(event) => String(event.id)}
                rowClassName={(event) =>
                  event.id === checkedEventId ? "bg-primary/5" : undefined
                }
              />
            )}
          </div>
          <div
            className={cn(
              "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
              // 346px card + 16px gap from the table + 4px gutter so the
              // card's ring/shadow aren't clipped by overflow-hidden
              checkedEventId !== null ? "w-[366px]" : "w-0",
            )}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && checkedEventId === null) {
                setRenderedEventId(null);
              }
            }}
          >
            {renderedEventId !== null && (
              <div className="h-full py-1 pr-1 pl-4">
                <ReportDetailPanel
                  dashboardId={dashboardId}
                  projectId={projectId}
                  eventId={renderedEventId}
                  onClose={() => setCheckedEventId(null)}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
