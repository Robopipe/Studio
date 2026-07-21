import type { SessionSummary } from "@/core/cameraApi/schemas/events";
import { Button } from "@/modules/shadcn/ui/button";
import { DateTimePicker } from "@/modules/shadcn/ui/date-time-picker";
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
        {/* h-8! aligns with the sm buttons/pickers — the trigger's own
            data-[size=sm]:h-9 outweighs a plain h-8. */}
        <SelectTrigger size="sm" className="h-8! w-64">
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
      <DateTimePicker
        edge="from"
        value={exportFrom}
        onChange={onExportFromChange}
        placeholder="From"
      />
      <DateTimePicker
        edge="to"
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
        Export
      </Button>
    </div>
  );
};
