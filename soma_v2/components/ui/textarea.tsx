import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        // Updated to match Input component styling: px-3 py-2, text-sm, consistent border and focus
        "w-full px-3 py-2 border-2 border-border/50 rounded-lg bg-background/50 text-foreground text-sm font-medium focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20 transition-colors duration-200 min-h-20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
