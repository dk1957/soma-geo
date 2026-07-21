import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex min-w-0 shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-lg file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-5 py-4 border-2 rounded-lg text-foreground font-medium focus:ring-2 focus:ring-primary/20 duration-200 h-9 bg-background/50 border-border/50 focus:bg-background focus:border-border transition-colors text-sm w-full",
        className
      )}
      {...props}
    />
  )
}

export { Input }
