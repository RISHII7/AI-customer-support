import { useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, type SupportEvent } from "@/lib/types"

export function EventsPage() {
  const [events, setEvents] = useState<SupportEvent[]>([])
  const [checking, setChecking] = useState(false)
  const [search, setSearch] = useState("")
  const [expandedError, setExpandedError] = useState<SupportEvent | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const load = () =>
    api<SupportEvent[]>("/events").then((data) => {
      setEvents(data)
      setLastChecked(new Date())
    })

  useEffect(() => {
    load()
  }, [])

  async function checkInbox() {
    setChecking(true)
    try {
      await api("/poll", { method: "POST" })
      await load()
    } finally {
      setChecking(false)
    }
  }

  // Filter events client-side without altering API contract
  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.id.toString().includes(q) ||
      (e.status && e.status.toLowerCase().includes(q)) ||
      (e.gmail_message_id && e.gmail_message_id.toLowerCase().includes(q)) ||
      (e.error && e.error.toLowerCase().includes(q))
    )
  })

  // Quick metrics derived from real data
  const totalEvents = events.length
  const processedCount = events.filter(
    (e) => (e.status || "").toLowerCase() === "processed"
  ).length
  const skippedCount = events.filter(
    (e) => (e.status || "").toLowerCase() === "skipped"
  ).length
  const failedCount = events.filter(
    (e) =>
      (e.status || "").toLowerCase() === "failed" ||
      (e.status || "").toLowerCase() === "error"
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#17231F]">
            Events
          </h1>
          <p className="mt-1 text-sm text-[#63716A]">
            Monitor incoming support events and processing activity in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#929D96]">
              <Clock className="size-3.5" />
              <span>Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}
          <Button
            onClick={checkInbox}
            disabled={checking}
            className="h-9 gap-2 rounded-lg bg-[#173D34] px-4 font-medium text-white shadow-xs hover:bg-[#245548] active:scale-[0.99] transition-all disabled:opacity-70"
          >
            <RefreshCw
              className={`size-4 ${checking ? "animate-spin text-white" : ""}`}
            />
            <span>{checking ? "Checking inbox..." : "Check inbox now"}</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards (Linear / Stripe style) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#63716A]">Total Events</span>
            <Layers className="size-4 text-[#929D96]" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#17231F]">{totalEvents}</p>
        </div>
        <div className="rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#63716A]">Processed</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{processedCount}</p>
        </div>
        <div className="rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#63716A]">Skipped (Filters)</span>
            <Clock className="size-4 text-stone-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-stone-700">{skippedCount}</p>
        </div>
        <div className="rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#63716A]">Errors</span>
            <AlertCircle className="size-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-rose-700">{failedCount}</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-[#E3E9E4] bg-white shadow-xs">
        {/* Table Search & Filter Toolbar */}
        <div className="flex items-center justify-between border-b border-[#E3E9E4] px-4 py-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-[#929D96]" />
            <Input
              type="text"
              placeholder="Search by event ID, status, or error..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 text-xs border-[#E3E9E4] bg-[#F5F7F5]/50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34]"
            />
          </div>
          <span className="text-xs text-[#63716A]">
            Showing {filteredEvents.length} of {events.length} events
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#F5F7F5]/60">
              <TableRow className="border-b border-[#E3E9E4] hover:bg-transparent">
                <TableHead className="w-[100px] text-xs font-semibold tracking-wider text-[#63716A] uppercase">
                  ID
                </TableHead>
                <TableHead className="w-[140px] text-xs font-semibold tracking-wider text-[#63716A] uppercase">
                  Status
                </TableHead>
                <TableHead className="w-[120px] text-xs font-semibold tracking-wider text-[#63716A] uppercase">
                  Attempts
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-[#63716A] uppercase">
                  Error
                </TableHead>
                <TableHead className="w-[200px] text-right text-xs font-semibold tracking-wider text-[#63716A] uppercase">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-sm text-[#929D96]"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="size-8 text-[#929D96]/60" />
                      <p className="font-medium text-[#63716A]">
                        {events.length === 0
                          ? "No events recorded yet"
                          : "No events match your search"}
                      </p>
                      <p className="text-xs text-[#929D96]">
                        {events.length === 0
                          ? "Click 'Check inbox now' above to ingest incoming Gmail events."
                          : "Try adjusting your search query."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className="border-b border-[#E3E9E4]/80 transition-colors hover:bg-[#F5F7F5]/80"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-[#173D34]">
                      #{event.id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-[#F0F3F0] px-2 py-0.5 font-mono text-xs text-[#63716A]">
                        {event.attempts} {event.attempts === 1 ? "attempt" : "attempts"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {event.error ? (
                        <button
                          type="button"
                          onClick={() => setExpandedError(event)}
                          className="group flex items-center gap-1.5 text-left text-xs text-rose-700 hover:text-rose-900 transition-colors"
                        >
                          <span className="max-w-md truncate font-mono">
                            {event.error}
                          </span>
                          <span className="shrink-0 text-[11px] underline opacity-80 group-hover:opacity-100">
                            (view)
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#929D96] italic">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-[#63716A]">
                      {formatDate(event.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Expanded Error Modal / Drawer */}
      {expandedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#E3E9E4] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3E9E4] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-rose-600" />
                <h3 className="font-semibold text-[#17231F]">
                  Event #{expandedError.id} Error Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpandedError(null)}
                className="rounded-lg p-1 text-[#929D96] hover:bg-[#F0F3F0] hover:text-[#17231F]"
              >
                <XCircle className="size-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="text-xs text-[#63716A]">
                <span className="font-semibold text-[#17231F]">Gmail Message ID:</span>{" "}
                <span className="font-mono">{expandedError.gmail_message_id}</span>
              </div>
              <div className="text-xs text-[#63716A]">
                <span className="font-semibold text-[#17231F]">Timestamp:</span>{" "}
                {formatDate(expandedError.created_at)}
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                <p className="text-xs font-semibold text-rose-800">Error Payload:</p>
                <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap font-mono text-xs text-rose-900">
                  {expandedError.error}
                </pre>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedError(null)}
                className="border-[#E3E9E4]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
