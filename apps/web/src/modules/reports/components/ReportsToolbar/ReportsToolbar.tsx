import { Button } from "@/modules/shadcn/ui/button";
import { DatePicker } from "@/modules/shadcn/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import type { ReportSession } from "../../types";

export const ALL_SESSIONS = "all";

interface ReportsToolbarProps {
  sessions: ReportSession[];
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  from: Date | undefined;
  onFromChange: (date: Date | undefined) => void;
  to: Date | undefined;
  onToChange: (date: Date | undefined) => void;
  onExport: () => void;
}

export const ReportsToolbar = ({
  sessions,
  sessionId,
  onSessionChange,
  from,
  onFromChange,
  to,
  onToChange,
  onExport,
}: ReportsToolbarProps) => {
  const selectedLabel =
    sessionId === ALL_SESSIONS
      ? "All sessions"
      : sessions.find((session) => session.id === sessionId)?.name;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={sessionId}
        onValueChange={(value) => {
          if (value !== null) onSessionChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-56">
          <SelectValue placeholder="Select session">
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SESSIONS}>All sessions</SelectItem>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePicker value={from} onChange={onFromChange} placeholder="From" />
      <DatePicker value={to} onChange={onToChange} placeholder="To" />
      <Button size="sm" onClick={onExport}>
        Export
      </Button>
    </div>
  );
};
