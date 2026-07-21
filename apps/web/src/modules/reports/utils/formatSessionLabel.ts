import type { SessionSummary } from "@/core/cameraApi/schemas/events";
import { format, isSameDay } from "date-fns";

export function formatSessionLabel(session: SessionSummary): string {
  const start = new Date(session.start_time);
  const startLabel = format(start, "dd.MM.yyyy HH:mm");

  if (!session.end_time) {
    return `${startLabel} – running`;
  }

  const end = new Date(session.end_time);
  const endLabel = format(
    end,
    isSameDay(start, end) ? "HH:mm" : "dd.MM.yyyy HH:mm",
  );
  return `${startLabel} – ${endLabel}`;
}
