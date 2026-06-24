import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useEffect, useRef, useState } from "react";
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
  const [nowDate, setNowDate] = useState(() => new Date());

  useEffect(() => {
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNowDate(new Date());
      interval = setInterval(() => setNowDate(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const maxAllowed = formatLocalDateTime(nowDate);

  const [start, setStart] = useState(() => formatLocalDateTime(
    new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0),
  ));
  const [end, setEnd] = useState(() => formatLocalDateTime(nowDate));
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
    const submitNow = new Date();
    const submitMax = formatLocalDateTime(submitNow);
    if (start && start > submitMax) {
      toast.error("Start cannot be in the future");
      return;
    }
    if (end && end > submitMax) {
      toast.error("End cannot be in the future");
      return;
    }
    if (start && end && start > end) {
      toast.error("Start must be before end");
      return;
    }

    try {
      await onSubmit({ start: toUtcIsoOrNull(start), end: toUtcIsoOrNull(end) });
      const resetNow = new Date();
      setStart(formatLocalDateTime(
        new Date(resetNow.getFullYear(), resetNow.getMonth(), resetNow.getDate(), 0, 0),
      ));
      setEnd(formatLocalDateTime(resetNow));
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
