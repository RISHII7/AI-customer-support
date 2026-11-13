import { useEffect, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Calendar,
  Inbox,
  Mail,
  Search,
  Sparkles,
  Tag,
  User,
} from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { formatDate, type Message, type Ticket } from "@/lib/types"

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mobileShowConversation, setMobileShowConversation] = useState(false)

  useEffect(() => {
    api<Ticket[]>("/tickets").then((data) => {
      setTickets(data)
      // Auto-select the first ticket on desktop if none selected
      if (data.length > 0 && !selected) {
        open(data[0])
      }
    })
  }, [])

  async function open(ticket: Ticket) {
    setSelected(ticket)
    setLoadingMessages(true)
    setMobileShowConversation(true)
    try {
      const data = await api<Message[]>(`/tickets/${ticket.id}/messages`)
      setMessages(data)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Client-side filtering preserves exact API contracts
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase())) ||
      (t.proposed_action &&
        t.proposed_action.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus =
      statusFilter === "all" ||
      (t.status && t.status.toLowerCase() === statusFilter.toLowerCase())

    return matchesSearch && matchesStatus
  })

  // Format message text with elegant styling for email quotes
  const renderMessageBody = (body: string) => {
    const lines = body.split("\n")
    return lines.map((line, idx) => {
      const isQuote = line.trim().startsWith(">") || line.trim().startsWith("On ") && line.includes("wrote:")
      if (isQuote) {
        return (
          <span
            key={idx}
            className="block border-l-2 border-[#D4DDD6] pl-2 text-xs italic text-[#63716A]"
          >
            {line}
          </span>
        )
      }
      return (
        <span key={idx} className="block">
          {line || "\u00A0"}
        </span>
      )
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#17231F]">
            Tickets Workspace
          </h1>
          <p className="text-sm text-[#63716A]">
            Manage incoming inquiries, triage agent decisions, and review full thread history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#63716A]">
            {tickets.length} total tickets
          </span>
        </div>
      </div>

      {/* Two-Panel Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Ticket List (~48%) */}
        <div
          className={`lg:col-span-5 flex flex-col gap-3 min-w-0 rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs ${
            mobileShowConversation ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search Bar & Filters */}
          <div className="flex flex-col gap-2.5">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-[#929D96]" />
              <Input
                type="text"
                placeholder="Search subject, email, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-9 text-xs border-[#E3E9E4] bg-[#F5F7F5]/60 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-[#173D34] text-white"
                    : "bg-[#F0F3F0] text-[#63716A] hover:text-[#17231F]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("open")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  statusFilter === "open"
                    ? "bg-[#173D34] text-white"
                    : "bg-[#F0F3F0] text-[#63716A] hover:text-[#17231F]"
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("answered")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  statusFilter === "answered"
                    ? "bg-[#173D34] text-white"
                    : "bg-[#F0F3F0] text-[#63716A] hover:text-[#17231F]"
                }`}
              >
                Answered
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("escalated")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  statusFilter === "escalated"
                    ? "bg-[#173D34] text-white"
                    : "bg-[#F0F3F0] text-[#63716A] hover:text-[#17231F]"
                }`}
              >
                Escalated
              </button>
            </div>
          </div>

          {/* Ticket List Items Container */}
          <div className="flex flex-col divide-y divide-[#E3E9E4] overflow-y-auto max-h-[calc(100vh-270px)] -mx-4 px-4">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#929D96]">
                <Inbox className="mx-auto size-8 text-[#929D96]/60 mb-2" />
                <p className="font-medium text-[#63716A]">No tickets found</p>
                <p className="text-xs text-[#929D96]">
                  {tickets.length === 0
                    ? "Inbound customer emails will appear here."
                    : "Try clearing your search query or filters."}
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selected?.id === ticket.id
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => open(ticket)}
                    className={`group flex flex-col gap-2 py-3 px-3 text-left transition-all rounded-lg my-1 ${
                      isSelected
                        ? "bg-[#E7EFEA]/60 border-l-3 border-l-[#173D34] shadow-xs"
                        : "hover:bg-[#F5F7F5] border-l-3 border-l-transparent"
                    }`}
                  >
                    {/* Top Row: Customer & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-[#17231F]">
                        {ticket.customer_email}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#929D96]">
                        {new Date(ticket.updated_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Middle Row: Subject */}
                    <p
                      className={`truncate text-xs ${
                        isSelected
                          ? "font-semibold text-[#173D34]"
                          : "font-medium text-[#17231F]"
                      }`}
                    >
                      {ticket.subject}
                    </p>

                    {/* Bottom Row: Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={ticket.status} />
                      {ticket.category && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#F0F3F0] px-2 py-0.5 text-[10px] font-medium text-[#63716A]">
                          <Tag className="size-2.5" />
                          {ticket.category}
                        </span>
                      )}
                      {ticket.proposed_action && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200/50">
                          <AlertCircle className="size-2.5" />
                          {ticket.proposed_action}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel: Selected Ticket Conversation (~52%) */}
        <div
          className={`lg:col-span-7 flex flex-col min-w-0 rounded-xl border border-[#E3E9E4] bg-white shadow-xs overflow-hidden sticky top-20 max-h-[calc(100vh-140px)] ${
            !mobileShowConversation ? "hidden lg:flex" : "flex"
          }`}
        >
          {selected ? (
            <div className="flex flex-col h-full min-h-[560px]">
              {/* Conversation Header */}
              <div className="border-b border-[#E3E9E4] bg-[#F5F7F5]/50 p-4 sm:p-5">
                {/* Mobile Back Button */}
                <div className="mb-2 lg:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileShowConversation(false)}
                    className="h-7 gap-1 px-2 text-xs text-[#63716A]"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to tickets</span>
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-[#17231F] leading-snug">
                      {selected.subject}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>

                  {/* Customer details bar */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#63716A]">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5 text-[#929D96]" />
                      <strong className="text-[#17231F]">Customer:</strong>{" "}
                      {selected.customer_email}
                    </span>
                    {selected.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="size-3.5 text-[#929D96]" />
                        <strong className="text-[#17231F]">Category:</strong>{" "}
                        {selected.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-[#929D96]" />
                      <span>{formatDate(selected.updated_at)}</span>
                    </span>
                  </div>

                  {/* Proposed Action Callout Banner */}
                  {selected.proposed_action && (
                    <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
                      <Sparkles className="size-4 shrink-0 text-amber-700" />
                      <div className="flex-1">
                        <span className="font-semibold text-amber-950">
                          Autonomous Agent Recommendation:
                        </span>{" "}
                        <span className="font-mono font-medium">
                          {selected.proposed_action}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
                {loadingMessages ? (
                  <div className="flex h-48 items-center justify-center gap-2 text-sm text-[#929D96]">
                    <div className="size-4 animate-spin rounded-full border-2 border-[#173D34] border-t-transparent" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#929D96]">
                    No messages recorded for this ticket yet.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOutbound = message.direction === "out"

                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col gap-1.5 ${
                          isOutbound ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Message Meta Info */}
                        <div className="flex items-center gap-2 px-1 text-[11px] text-[#63716A]">
                          {isOutbound ? (
                            <>
                              <span className="flex items-center gap-1 font-semibold text-[#173D34]">
                                <Bot className="size-3 text-[#173D34]" />
                                Harbor &amp; Pine AI Support
                              </span>
                              <span>&bull;</span>
                              <span>{formatDate(message.created_at)}</span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 font-semibold text-[#17231F]">
                                <Mail className="size-3 text-[#63716A]" />
                                {message.from_address}
                              </span>
                              <span>&bull;</span>
                              <span>{formatDate(message.created_at)}</span>
                            </>
                          )}
                        </div>

                        {/* Message Bubble Card */}
                        <div
                          className={`rounded-xl p-4 text-[13.5px] leading-relaxed shadow-xs max-w-[94%] ${
                            isOutbound
                              ? "bg-[#E7EFEA]/80 border border-[#D4DDD6] text-[#17231F]"
                              : "bg-white border border-[#E3E9E4] text-[#17231F]"
                          }`}
                        >
                          <div className="space-y-1">
                            {renderMessageBody(message.body)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Conversation Footer status bar */}
              <div className="border-t border-[#E3E9E4] bg-[#F5F7F5]/40 px-4 py-2.5 text-xs text-[#929D96] flex items-center justify-between">
                <span>Thread ID: #{selected.id}</span>
                <span>{messages.length} messages in thread</span>
              </div>
            </div>
          ) : (
            /* Thoughtful Empty State (Intercom-inspired) */
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[480px]">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E7EFEA] text-[#173D34] shadow-xs mb-4">
                <Mail className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-[#17231F]">
                Select a ticket to view the conversation
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-[#63716A] leading-relaxed">
                Choose a customer ticket from the list on the left to inspect
                customer inquiries, review AI decisions, and follow the
                support thread.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
