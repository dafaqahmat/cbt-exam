import { CheckIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <span
      data-slot="checkbox-root"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-transparent transition-colors",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        className="peer sr-only"
        {...props}
      />
      <CheckIcon
        className={cn(
          "pointer-events-none size-3",
          checked ? "opacity-100" : "opacity-0"
        )}
      />
    </span>
  )
}

export { Checkbox }