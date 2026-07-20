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

const PASSED_FILTER_LABELS: Record<PassedFilter, string> = {
  all: "All results",
  passed: "Passed",
  failed: "Failed",
};

interface ReportsToolbarProps {
  sessions: SessionSummary[];
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  from: Date | undefined;
  onFromChange: (date: Date | undefined) => void;
  to: Date | undefined;
  onToChange: (date: Date | undefined) => void;
  passedFilter: PassedFilter;
  onPassedFilterChange: (value: PassedFilter) => void;
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
  from,
  onFromChange,
  to,
  onToChange,
  passedFilter,
  onPassedFilterChange,
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
      <DatePicker value={from} onChange={onFromChange} placeholder="From" />
      <DatePicker value={to} onChange={onToChange} placeholder="To" />
      <Select
        value={passedFilter}
        onValueChange={(value) => {
          if (value !== null) onPassedFilterChange(value as PassedFilter);
        }}
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue>{PASSED_FILTER_LABELS[passedFilter]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PASSED_FILTER_LABELS) as PassedFilter[]).map(
            (value) => (
              <SelectItem key={value} value={value}>
                {PASSED_FILTER_LABELS[value]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
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
