"use client"

import * as React from "react"
import { format, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/modules/shadcn/ui/button"
import { Calendar } from "@/modules/shadcn/ui/calendar"
import {
  mergeTime,
  withTimeString,
} from "@/modules/shadcn/ui/date-time-range-picker"
import { Input } from "@/modules/shadcn/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover"

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  /** Which end of a range this picker represents — drives the default
   * time-of-day (00:00:00.000 vs 23:59:59.999) and the seconds an edited
   * time snaps to. */
  edge: "from" | "to"
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Single date + time picker: DatePicker's popover-button shell with the
 * DateTimeRangePanel's time-input row. Stays open after a calendar click so
 * the time can still be adjusted.
 */
function DateTimePicker({
  value,
  onChange,
  edge,
  placeholder = "Pick a date",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "justify-start font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="size-4" />
            {value ? format(value, "dd.MM.yyyy HH:mm") : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          // Normalize to day precision — the calendar compares against the
          // exact timestamp, so a 08:30 value would unselect its own day.
          selected={value && startOfDay(value)}
          // Re-selecting the highlighted day yields undefined — the clear affordance.
          onSelect={(date) => {
            onChange(date ? mergeTime(date, value, edge) : undefined)
          }}
        />
        <div className="flex items-center gap-2 border-t p-3">
          <span className="text-sm text-muted-foreground">Time</span>
          <Input
            type="time"
            value={value ? format(value, "HH:mm") : ""}
            disabled={!value}
            onChange={(e) => {
              if (!value || !e.target.value) return
              onChange(withTimeString(value, e.target.value, edge))
            }}
            className="h-8 w-fit bg-background px-2 text-sm"
            aria-label={`${edge} time`}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateTimePicker }
