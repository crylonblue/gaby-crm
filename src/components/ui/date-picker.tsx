"use client"

import * as React from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { ControllerRenderProps } from "react-hook-form"
import { de as deLocale } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  field: ControllerRenderProps<any, string>
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ field, placeholder = "Datum auswählen", disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the date string (YYYY-MM-DD) to Date object
  const dateValue = React.useMemo(() => {
    if (!field.value) return undefined
    // Handle YYYY-MM-DD format
    const date = new Date(field.value + "T00:00:00")
    return isNaN(date.getTime()) ? undefined : date
  }, [field.value])

  // Initialize month to selected date or current date
  const [month, setMonth] = React.useState<Date>(() => dateValue || new Date())
  const [dayInput, setDayInput] = React.useState<string>("")
  const [monthInput, setMonthInput] = React.useState<string>("")
  const [yearInput, setYearInput] = React.useState<string>("")

  // Update month when dateValue changes externally
  React.useEffect(() => {
    if (dateValue) {
      setMonth(dateValue)
      // Pre-fill inputs when date is selected
      setDayInput(format(dateValue, "dd"))
      setMonthInput(format(dateValue, "MM"))
      setYearInput(format(dateValue, "yyyy"))
    }
  }, [dateValue])

  // Format date for display in German locale
  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return format(date, "dd.MM.yyyy", { locale: de })
  }

  // Handle date selection from calendar
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to YYYY-MM-DD format for storage
      const isoDate = format(date, "yyyy-MM-dd")
      field.onChange(isoDate)
    } else {
      field.onChange("")
    }
    setOpen(false)
  }

  // Handle day input change
  const handleDayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
    setDayInput(value)
    trySetDateFromInputs(value, monthInput, yearInput)
  }

  // Handle month input change
  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
    setMonthInput(value)
    trySetDateFromInputs(dayInput, value, yearInput)
  }

  // Handle year input change
  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    setYearInput(value)
    trySetDateFromInputs(dayInput, monthInput, value)
  }

  // Try to set date from inputs when all fields are filled
  const trySetDateFromInputs = (day: string, month: string, year: string) => {
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      const dayNum = parseInt(day, 10)
      const monthNum = parseInt(month, 10)
      const yearNum = parseInt(year, 10)

      if (
        !isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum) &&
        dayNum >= 1 && dayNum <= 31 &&
        monthNum >= 1 && monthNum <= 12 &&
        yearNum >= 1900 && yearNum <= new Date().getFullYear()
      ) {
        // Check if date is valid
        const testDate = new Date(yearNum, monthNum - 1, dayNum)
        if (
          testDate.getFullYear() === yearNum &&
          testDate.getMonth() === monthNum - 1 &&
          testDate.getDate() === dayNum
        ) {
          // Valid date - update calendar and form field
          setMonth(testDate)
          const isoDate = format(testDate, "yyyy-MM-dd")
          field.onChange(isoDate)
        }
      }
    }
  }

  // Handle month change from calendar
  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      setMonth(date)
    }
  }
  
  // Reset inputs when popover closes
  React.useEffect(() => {
    if (!open) {
      setDayInput("")
      setMonthInput("")
      setYearInput("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? formatDate(dateValue) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Date Input Fields */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Datum direkt eingeben
            </Label>
            <div className="flex items-center gap-1.5">
              <div className="w-12">
                <Input
                  id="day-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="TT"
                  value={dayInput}
                  onChange={handleDayInputChange}
                  className="h-8 text-center px-1"
                  maxLength={2}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" && dayInput.length === 2) {
                      e.preventDefault()
                      document.getElementById("month-input")?.focus()
                    }
                    if (e.key === "Escape") {
                      setDayInput("")
                    }
                  }}
                />
                <Label htmlFor="day-input" className="text-[10px] text-muted-foreground text-center block mt-1">
                  Tag
                </Label>
              </div>
              <span className="text-muted-foreground pt-4 text-sm">.</span>
              <div className="w-12">
                <Input
                  id="month-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={monthInput}
                  onChange={handleMonthInputChange}
                  className="h-8 text-center px-1"
                  maxLength={2}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" && monthInput.length === 0) {
                      e.preventDefault()
                      document.getElementById("day-input")?.focus()
                    }
                    if (e.key === "ArrowRight" && monthInput.length === 2) {
                      e.preventDefault()
                      document.getElementById("year-input")?.focus()
                    }
                    if (e.key === "Escape") {
                      setMonthInput("")
                    }
                  }}
                />
                <Label htmlFor="month-input" className="text-[10px] text-muted-foreground text-center block mt-1">
                  Monat
                </Label>
              </div>
              <span className="text-muted-foreground pt-4 text-sm">.</span>
              <div className="w-16">
                <Input
                  id="year-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="JJJJ"
                  value={yearInput}
                  onChange={handleYearInputChange}
                  className="h-8 text-center px-1"
                  maxLength={4}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" && yearInput.length === 0) {
                      e.preventDefault()
                      document.getElementById("month-input")?.focus()
                    }
                    if (e.key === "Escape") {
                      setYearInput("")
                    }
                  }}
                />
                <Label htmlFor="year-input" className="text-[10px] text-muted-foreground text-center block mt-1">
                  Jahr
                </Label>
              </div>
            </div>
          </div>
          
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            month={month}
            onMonthChange={handleMonthChange}
            initialFocus
            locale={deLocale}
            captionLayout="dropdown-buttons"
            fromYear={1900}
            toYear={new Date().getFullYear()}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

