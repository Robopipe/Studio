"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/modules/shadcn/ui/button"
import { Calendar } from "@/modules/shadcn/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcn/ui/popover"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
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
            {value ? format(value, "dd.MM.yyyy") : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          // Re-selecting the highlighted day yields undefined — the clear affordance.
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
