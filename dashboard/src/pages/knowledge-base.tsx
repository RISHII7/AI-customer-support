import { useEffect, useState } from "react"
import {
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  FolderOpen,
  Layers,
  Save,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { Entry } from "@/lib/types"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api<Entry[]>("/knowledge-base").then((data) => {
      setEntries(data)
      if (data.length > 0 && selectedId === null) {
        select(data[0])
      }
    })
  }, [])

  const sections = [...new Set(entries.map((entry) => entry.section))]

  function select(entry: Entry) {
    setSelectedId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setSaved(false)
  }

  async function save() {
    if (selectedId === null) return
    setSaving(true)
    try {
      const updated = await api<Entry>(`/knowledge-base/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      })
      setEntries(
        entries.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3500)
    } finally {
      setSaving(false)
    }
  }

  const selectedEntry = entries.find((e) => e.id === selectedId)

  // Filter entries in sidebar by search query
  const filteredEntries = entries.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#17231F]">
            Knowledge Base
          </h1>
          <p className="text-sm text-[#63716A]">
            Manage domain policies, return rules, and product specs utilized by AI decision agents.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#63716A]">
          <span className="rounded-md bg-[#E7EFEA] px-2 py-1 font-medium text-[#173D34]">
            {sections.length} Categories &bull; {entries.length} Articles
          </span>
        </div>
      </div>

      {/* Notion-inspired Two-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left Sidebar: Categories & Articles */}
        <aside className="rounded-xl border border-[#E3E9E4] bg-white p-4 shadow-xs flex flex-col gap-4">
          {/* Quick Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 size-4 text-[#929D96]" />
            <Input
              type="text"
              placeholder="Search knowledge base..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 text-xs border-[#E3E9E4] bg-[#F5F7F5]/60 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34]"
            />
          </div>

          {/* Hierarchical Categories Navigation */}
          <nav className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
            {sections.map((section) => {
              const categoryEntries = filteredEntries.filter(
                (entry) => entry.section === section
              )
              if (categoryEntries.length === 0) return null

              return (
                <div key={section} className="flex flex-col gap-1">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#63716A] uppercase">
                      <FolderOpen className="size-3 text-[#929D96]" />
                      {section.replace(/_/g, " ").replace(/-/g, " ")}
                    </span>
                    <span className="rounded-full bg-[#F0F3F0] px-1.5 py-0.2 text-[10px] font-medium text-[#929D96]">
                      {categoryEntries.length}
                    </span>
                  </div>

                  {/* Category Entries */}
                  <div className="flex flex-col gap-0.5 pl-1">
                    {categoryEntries.map((entry) => {
                      const isSelected = entry.id === selectedId
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => select(entry)}
                          className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
                            isSelected
                              ? "bg-[#E7EFEA] font-semibold text-[#173D34] shadow-2xs"
                              : "text-[#63716A] hover:bg-[#F5F7F5] hover:text-[#17231F]"
                          }`}
                        >
                          <FileText
                            className={`size-3.5 shrink-0 ${
                              isSelected
                                ? "text-[#173D34]"
                                : "text-[#929D96] group-hover:text-[#17231F]"
                            }`}
                          />
                          <span className="truncate">{entry.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Right Panel: Document Editor */}
        <section className="rounded-xl border border-[#E3E9E4] bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-5">
          {selectedId === null ? (
            <div className="flex flex-col items-center justify-center p-16 text-center min-h-[460px]">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E7EFEA] text-[#173D34] shadow-xs mb-4">
                <BookOpen className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-[#17231F]">
                Select an entry to edit
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-[#63716A] leading-relaxed">
                Choose an article from the category sidebar to view or edit
                its operational guidelines, product specs, or decision rules.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Document Breadcrumb & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E3E9E4] pb-4">
                <div className="flex items-center gap-2 text-xs text-[#63716A]">
                  <Layers className="size-3.5 text-[#929D96]" />
                  <span>Knowledge Base</span>
                  <span>/</span>
                  <span className="font-semibold text-[#173D34] uppercase">
                    {selectedEntry?.section}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {saved && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 animate-in fade-in duration-200">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Changes saved
                    </span>
                  )}
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="h-8 gap-1.5 rounded-lg bg-[#173D34] px-3.5 text-xs font-medium text-white shadow-xs hover:bg-[#245548] transition-all disabled:opacity-70"
                  >
                    <Save className="size-3.5" />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </Button>
                </div>
              </div>

              {/* Title Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="kb-title"
                  className="text-xs font-medium text-[#63716A]"
                >
                  Article Title
                </label>
                <Input
                  id="kb-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setSaved(false)
                  }}
                  placeholder="Enter article title..."
                  className="h-10 text-base font-semibold text-[#17231F] border-[#E3E9E4] focus-visible:ring-1 focus-visible:ring-[#173D34]"
                />
              </div>

              {/* Content Editor Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="kb-content"
                    className="text-xs font-medium text-[#63716A]"
                  >
                    Documentation Content (Markdown / Text)
                  </label>
                  <span className="text-[11px] text-[#929D96]">
                    {content.length} characters &bull; {content.split("\n").length} lines
                  </span>
                </div>
                <Textarea
                  id="kb-content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setSaved(false)
                  }}
                  className="min-h-[480px] p-4 font-mono text-xs sm:text-sm leading-relaxed border-[#E3E9E4] bg-[#F5F7F5]/40 focus:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34] transition-colors"
                  placeholder="Enter policy guidelines, specs, or procedures..."
                />
              </div>

              {/* Bottom Save Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E3E9E4] text-xs text-[#929D96]">
                <span>
                  PostgreSQL grounded record &bull; Section: {selectedEntry?.section}
                </span>
                <Button
                  onClick={save}
                  disabled={saving}
                  size="sm"
                  className="h-8 gap-1.5 bg-[#173D34] text-white hover:bg-[#245548]"
                >
                  <Check className="size-3.5" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
