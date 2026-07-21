"use client"

import { format, startOfDay } from "date-fns"
import { XIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/modules/shadcn/ui/button"
import { Calendar } from "@/modules/shadcn/ui/calendar"
import { Input } from "@/modules/shadcn/ui/input"

export interface DateTimeRange {
  from?: Date
  to?: Date
}

interface DateTimeRangePanelProps {
  value: DateTimeRange
  onChange: (range: DateTimeRange) => void
}

// Calendar clicks land at midnight; keep any time the user already picked,
// otherwise span the whole day so date-only usage keeps working.
export function mergeTime(
  day: Date,
  prev: Date | undefined,
  edge: "from" | "to",
) {
  const merged = new Date(day)
  if (prev) {
    merged.setHours(
      prev.getHours(),
      prev.getMinutes(),
      prev.getSeconds(),
      prev.getMilliseconds(),
    )
  } else if (edge === "to") {
    merged.setHours(23, 59, 59, 999)
  } else {
    merged.setHours(0, 0, 0, 0)
  }
  return merged
}

export function withTimeString(date: Date, time: string, edge: "from" | "to") {
  const [hours, minutes] = time.split(":").map(Number)
  const updated = new Date(date)
  if (edge === "to") updated.setHours(hours, minutes, 59, 999)
  else updated.setHours(hours, minutes, 0, 0)
  return updated
}

/**
 * Datetime-range selection panel (range calendar + per-edge time inputs);
 * meant to live inside a popover owned by the host. Both ends are optional —
 * each edge has its own clear button.
 */
function DateTimeRangePanel({ value, onChange }: DateTimeRangePanelProps) {
  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange({
      from: range?.from ? mergeTime(range.from, value.from, "from") : undefined,
      to: range?.to ? mergeTime(range.to, value.to, "to") : undefined,
    })
  }

  const handleTimeChange = (edge: "from" | "to", time: string) => {
    const current = value[edge]
    if (!current || !time) return
    onChange({ ...value, [edge]: withTimeString(current, time, edge) })
  }

  const handleClearEdge = (edge: "from" | "to") => {
    onChange({ ...value, [edge]: undefined })
  }

  return (
    <>
      <Calendar
        mode="range"
        // Normalize to day precision — the calendar compares against the exact
        // timestamps, so a 08:30 "from" would unselect its own day.
        selected={{
          from: value.from && startOfDay(value.from),
          to: value.to && startOfDay(value.to),
        }}
        onSelect={handleCalendarSelect}
      />
      <div className="flex flex-col gap-2 border-t p-3">
        {(["from", "to"] as const).map((edge) => (
          <div key={edge} className="flex items-center gap-2">
            <span className="w-10 text-sm text-muted-foreground capitalize">
              {edge}
            </span>
            <span className="w-20 text-sm">
              {value[edge] ? format(value[edge], "dd.MM.yyyy") : "—"}
            </span>
            <Input
              type="time"
              value={value[edge] ? format(value[edge], "HH:mm") : ""}
              disabled={!value[edge]}
              onChange={(e) => handleTimeChange(edge, e.target.value)}
              className="h-8 w-fit bg-background px-2 text-sm"
              aria-label={`${edge} time`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!value[edge]}
              onClick={() => handleClearEdge(edge)}
              aria-label={`Clear ${edge}`}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}

export { DateTimeRangePanel }
