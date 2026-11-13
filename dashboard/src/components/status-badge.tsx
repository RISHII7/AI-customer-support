import { cn } from "cn"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim()

  // Success / Completed states
  if (normalized === "processed" || normalized === "answered" || normalized === "closed" || normalized === "success") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-emerald-800 uppercase",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    )
  }

  // Escalated / Needs Attention states
  if (normalized === "escalated" || normalized === "needs-human" || normalized === "needs_human" || normalized === "warning") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-amber-900 uppercase",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    )
  }

  // Failed / Error states
  if (normalized === "failed" || normalized === "error") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-rose-800 uppercase",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-rose-500" />
        {status}
      </span>
    )
  }

  // Skipped / Ignored states
  if (normalized === "skipped") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-stone-700 uppercase",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-stone-400" />
        {status}
      </span>
    )
  }

  // Open / Processing / In-flight states
  if (normalized === "open" || normalized === "processing" || normalized === "pending") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-[#D4DDD6] bg-[#E7EFEA] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#173D34] uppercase",
          className
        )}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-[#173D34]" />
        {status}
      </span>
    )
  }

  // Neutral / Fallback
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/60" />
      {status}
    </span>
  )
}
