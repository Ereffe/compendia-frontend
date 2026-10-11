import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

// Local change: decorative (no hard-coded English label); every caller shows translated text next to it.
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      aria-hidden
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
