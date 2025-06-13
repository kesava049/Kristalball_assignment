
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  initialDateFrom?: Date
  initialDateTo?: Date
  onUpdate?: (date: { from: Date; to: Date }) => void
}

export function DateRangePicker({
  className,
  initialDateFrom,
  initialDateTo,
  onUpdate,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: initialDateFrom || new Date(),
    to: initialDateTo || new Date(),
  })

  // When the date changes, call the onUpdate function if provided
  React.useEffect(() => {
    if (date?.from && date?.to && onUpdate) {
      onUpdate(date as { from: Date; to: Date })
    }
  }, [date, onUpdate])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="text-white"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
