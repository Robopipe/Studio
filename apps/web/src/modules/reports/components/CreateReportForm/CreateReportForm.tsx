import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export interface CreateReportFormProps {
  onSubmit: (params: {
    start: string | null;
    end: string | null;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
}

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

const toUtcIsoOrNull = (value: string): string | null => {
  if (!value || !DATETIME_LOCAL_PATTERN.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const pad = (n: number) => n.toString().padStart(2, "0");

const formatLocalDateTime = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const isIncompleteDateTime = (value: string): boolean =>
  value !== "" && !DATETIME_LOCAL_PATTERN.test(value);

export const CreateReportForm = ({
  onSubmit,
  isSubmitting = false,
}: CreateReportFormProps) => {
  const { startOfToday, now } = useMemo(() => {
    const now = new Date();
    return {
      startOfToday: formatLocalDateTime(
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0),
      ),
      now: formatLocalDateTime(now),
    };
  }, []);
  const maxAllowed = now;

  const [start, setStart] = useState(startOfToday);
  const [end, setEnd] = useState(now);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (
      startRef.current?.validity.badInput ||
      endRef.current?.validity.badInput ||
      isIncompleteDateTime(start) ||
      isIncompleteDateTime(end)
    ) {
      toast.error("Please provide both date and time");
      return;
    }
    if (start && start > maxAllowed) {
      toast.error("Start cannot be in the future");
      return;
    }
    if (end && end > maxAllowed) {
      toast.error("End cannot be in the future");
      return;
    }
    if (start && end && start > end) {
      toast.error("Start must be before end");
      return;
    }

    try {
      await onSubmit({ start: toUtcIsoOrNull(start), end: toUtcIsoOrNull(end) });
      setStart(startOfToday);
      setEnd(now);
    } catch {
      // parent surfaces the error; keep the user's input so they can retry
    }
  };

  const startMax = end && end < maxAllowed ? end : maxAllowed;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-black/10 bg-white p-4">
      <span className="text-sm font-bold">Create new report</span>
      <div className="flex flex-row flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-start">Start (optional)</Label>
          <Input
            ref={startRef}
            id="report-start"
            type="datetime-local"
            value={start}
            max={startMax}
            onChange={(e) => setStart(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-end">End (optional)</Label>
          <Input
            ref={endRef}
            id="report-end"
            type="datetime-local"
            value={end}
            min={start || undefined}
            max={maxAllowed}
            onChange={(e) => setEnd(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
      </div>
    </div>
  );
};
