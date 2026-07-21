"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center pt-1 relative items-center w-full mb-1",
        caption_label: "text-sm font-semibold text-gray-900",
        nav: "flex items-center justify-between absolute inset-x-0 z-10 px-1",
        button_previous: cn(
          "inline-flex items-center justify-center h-8 w-8 bg-transparent hover:bg-gray-100 rounded-full transition-colors",
          "text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none"
        ),
        button_next: cn(
          "inline-flex items-center justify-center h-8 w-8 bg-transparent hover:bg-gray-100 rounded-full transition-colors",
          "text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-gray-400 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider",
        week: "flex w-full mt-0.5",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "h-10 w-10",
          "[&:has([aria-selected])]:bg-blue-50",
          "[&:has([aria-selected].day-range-end)]:rounded-r-full",
          "[&:has([aria-selected].day-range-start)]:rounded-l-full",
          "[&:has([aria-selected].day-outside)]:bg-blue-50/40"
        ),
        day_button: cn(
          "inline-flex items-center justify-center h-10 w-10 rounded-full text-sm font-normal",
          "transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          "aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-l-full",
        range_end: "day-range-end rounded-r-full",
        selected: cn(
          "bg-gray-900 text-white hover:bg-gray-900 hover:text-white",
          "focus:bg-gray-900 focus:text-white"
        ),
        today: "bg-gray-100 text-gray-900 font-semibold ring-1 ring-gray-300",
        outside: "day-outside text-gray-300 aria-selected:bg-blue-50/40 aria-selected:text-gray-400",
        disabled: "text-gray-200 cursor-not-allowed hover:bg-transparent",
        range_middle: "aria-selected:bg-blue-50 aria-selected:text-gray-900",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
