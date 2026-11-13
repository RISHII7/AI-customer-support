import { useState } from "react"
import { Activity, BookOpen, LogOut, Ticket as TicketIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isLoggedIn, logout } from "@/lib/api"
import { EventsPage } from "@/pages/events"
import { KnowledgeBasePage } from "@/pages/knowledge-base"
import { LoginPage } from "@/pages/login"
import { TicketsPage } from "@/pages/tickets"

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [activeTab, setActiveTab] = useState("events")

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  function logOut() {
    logout()
    setLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#17231F] flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E3E9E4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#173D34] text-white shadow-xs">
              {/* Pine Tree SVG Emblem */}
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L6 9h4l-4 7h6v5h2v-5h6l-4-7h4z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-[#17231F]">
                  Harbor &amp; Pine
                </span>
                <span className="rounded bg-[#E7EFEA] px-1.5 py-0.5 text-[11px] font-medium text-[#173D34]">
                  Support Ops
                </span>
              </div>
              <span className="text-[11px] text-[#63716A]">
                AI Customer Automation Hub
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Linear-inspired) */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="hidden md:flex"
          >
            <TabsList className="h-9 gap-1 rounded-lg border border-[#E3E9E4] bg-[#F0F3F0] p-1">
              <TabsTrigger
                value="events"
                className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-[#63716A] transition-all hover:text-[#17231F] data-active:bg-white data-active:text-[#173D34] data-active:shadow-xs"
              >
                <Activity className="size-3.5" />
                <span>Events</span>
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-[#63716A] transition-all hover:text-[#17231F] data-active:bg-white data-active:text-[#173D34] data-active:shadow-xs"
              >
                <TicketIcon className="size-3.5" />
                <span>Tickets</span>
              </TabsTrigger>
              <TabsTrigger
                value="knowledge-base"
                className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-[#63716A] transition-all hover:text-[#17231F] data-active:bg-white data-active:text-[#173D34] data-active:shadow-xs"
              >
                <BookOpen className="size-3.5" />
                <span>Knowledge Base</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* User actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px]">System Ready</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logOut}
              className="h-8 gap-1.5 rounded-lg border-[#E3E9E4] bg-white text-xs font-medium text-[#63716A] hover:bg-[#F5F7F5] hover:text-[#17231F] transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-[#E3E9E4] bg-[#F5F7F5] px-4 py-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-9 bg-[#E3E9E4]/60 p-1">
              <TabsTrigger value="events" className="text-xs font-medium">
                Events
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs font-medium">
                Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge-base" className="text-xs font-medium">
                Knowledge
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="events" className="outline-none m-0">
            <EventsPage />
          </TabsContent>
          <TabsContent value="tickets" className="outline-none m-0">
            <TicketsPage />
          </TabsContent>
          <TabsContent value="knowledge-base" className="outline-none m-0">
            <KnowledgeBasePage />
          </TabsContent>
        </Tabs>
      </main>

      {/* Refined enterprise footer */}
      <footer className="mt-auto border-t border-[#E3E9E4] bg-white py-4 text-center text-xs text-[#929D96]">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#63716A]">Harbor &amp; Pine Support Suite</span>
            <span>&bull;</span>
            <span>Powered by NVIDIA NIM &amp; Pydantic AI</span>
          </div>
          <div>Secure Enterprise Console &bull; PostgreSQL Grounded</div>
        </div>
      </footer>
    </div>
  )
}
