import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { useState } from "react";

export interface CreateReportFormProps {
  onSubmit: (params: { start: string | null; end: string | null }) => void;
  isSubmitting?: boolean;
}

const toIsoOrNull = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const CreateReportForm = ({
  onSubmit,
  isSubmitting = false,
}: CreateReportFormProps) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleSubmit = () => {
    onSubmit({ start: toIsoOrNull(start), end: toIsoOrNull(end) });
    setStart("");
    setEnd("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-black/10 bg-white p-4">
      <span className="text-sm font-bold">Create new report</span>
      <div className="flex flex-row flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-start">Start (optional)</Label>
          <Input
            id="report-start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-end">End (optional)</Label>
          <Input
            id="report-end"
            type="datetime-local"
            value={end}
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
