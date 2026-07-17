import { TooltipProvider } from "@/modules/shadcn/ui/tooltip";
import { DataTable } from "@/modules/ui/components/Table";
import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MOCK_RECORDS, MOCK_SESSIONS } from "../../mocks/reportRecords";
import type { EvaluationRecord } from "../../types";
import { ReportDetailPanel } from "../ReportDetailPanel";
import { ALL_SESSIONS, ReportsToolbar } from "../ReportsToolbar";
import { useReportColumns } from "./useReportColumns";

export const ReportsPage = () => {
  const [sessionId, setSessionId] = useState<string>(ALL_SESSIONS);
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);
  const [checkedRecord, setCheckedRecord] = useState<EvaluationRecord | null>(
    null,
  );

  const filteredRecords = useMemo(
    () =>
      MOCK_RECORDS.filter((record) => {
        if (sessionId !== ALL_SESSIONS && record.sessionId !== sessionId) {
          return false;
        }

        const sessionStart = new Date(record.sessionStart);
        if (from && sessionStart < startOfDay(from)) return false;
        if (to && sessionStart > endOfDay(to)) return false;

        return true;
      }),
    [sessionId, from, to],
  );

  // Close the detail panel when its record gets filtered out.
  useEffect(() => {
    if (
      checkedRecord &&
      !filteredRecords.some((record) => record.id === checkedRecord.id)
    ) {
      setCheckedRecord(null);
    }
  }, [filteredRecords, checkedRecord]);

  const handleCheck = useCallback((record: EvaluationRecord) => {
    setCheckedRecord(record);
  }, []);

  const handleExport = useCallback(() => {
    toast.info("Export is not available yet");
  }, []);

  const columns = useReportColumns({ onCheck: handleCheck });

  return (
    <TooltipProvider delay={400}>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h5 className="text-xl font-semibold">All Test Cases</h5>
            <ReportsToolbar
              sessions={MOCK_SESSIONS}
              sessionId={sessionId}
              onSessionChange={setSessionId}
              from={from}
              onFromChange={setFrom}
              to={to}
              onToChange={setTo}
              onExport={handleExport}
            />
          </div>
          <DataTable
            data={filteredRecords}
            columns={columns}
            enableRowSelection
            pageSize={20}
            rowClassName={(record) =>
              record.id === checkedRecord?.id ? "bg-primary/5" : undefined
            }
          />
        </div>
        {checkedRecord && (
          <ReportDetailPanel
            record={checkedRecord}
            onClose={() => setCheckedRecord(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
