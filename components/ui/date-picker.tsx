"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

type DatePickerProps = {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  dateFormat?: string
  disabled?: boolean
  className?: string
  calendarProps?: Omit<React.ComponentProps<typeof Calendar>, "mode" | "selected" | "onSelect">
}

function DatePicker({
  value,
  onValueChange,
  placeholder = "Choose a date",
  dateFormat = "PPP",
  disabled,
  className,
  calendarProps,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 size-4" aria-hidden="true" />
          {value ? format(value, dateFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange?.(date)
            setOpen(false)
          }}
          autoFocus
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { DatePickerProps }
