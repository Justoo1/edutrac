import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface MonthPickerProps {
  selected: Date
  onSelect: (date: Date) => void
  disabled?: boolean
}

export function MonthPicker({ selected, onSelect, disabled }: MonthPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full sm:w-[200px] justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "MMMM yyyy") : "Select month"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onSelect(date)}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 