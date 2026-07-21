import type { SessionSummary } from "@/core/cameraApi/schemas/events";
import { Button } from "@/modules/shadcn/ui/button";
import { DatePicker } from "@/modules/shadcn/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { formatSessionLabel } from "../../utils/formatSessionLabel";

export const ALL_SESSIONS = "all";

export type PassedFilter = "all" | "passed" | "failed";

interface ReportsToolbarProps {
  sessions: SessionSummary[];
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  /** Date range scoping the export only — table filtering lives in the column headers. */
  exportFrom: Date | undefined;
  onExportFromChange: (date: Date | undefined) => void;
  exportTo: Date | undefined;
  onExportToChange: (date: Date | undefined) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExport: () => void;
  isExporting?: boolean;
  selectedCount?: number;
}

export const ReportsToolbar = ({
  sessions,
  sessionId,
  onSessionChange,
  exportFrom,
  onExportFromChange,
  exportTo,
  onExportToChange,
  onRefresh,
  isRefreshing = false,
  onExport,
  isExporting = false,
  selectedCount = 0,
}: ReportsToolbarProps) => {
  const selectedLabel =
    sessionId === ALL_SESSIONS
      ? "All sessions"
      : (() => {
          const session = sessions.find((s) => String(s.id) === sessionId);
          return session ? formatSessionLabel(session) : undefined;
        })();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={sessionId}
        onValueChange={(value) => {
          if (value !== null) onSessionChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-64">
          <SelectValue placeholder="Select session">
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SESSIONS}>All sessions</SelectItem>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={String(session.id)}>
              {formatSessionLabel(session)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePicker
        value={exportFrom}
        onChange={onExportFromChange}
        placeholder="From"
      />
      <DatePicker
        value={exportTo}
        onChange={onExportToChange}
        placeholder="To"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        aria-label="Refresh"
      >
        <RefreshCwIcon className={isRefreshing ? "animate-spin" : undefined} />
      </Button>
      <Button size="sm" onClick={onExport} disabled={isExporting}>
        {isExporting && <Loader2Icon className="animate-spin" />}
        {selectedCount > 0 ? `Export (${selectedCount})` : "Export"}
      </Button>
    </div>
  );
};
