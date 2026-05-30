"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText, AlertTriangle, Upload, MessageSquare,
  Shield, TrendingUp, Clock, CheckCircle, XCircle,
  Trash2, Loader2, Database, Search, StickyNote, ChevronDown, ChevronUp,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import {
  getDocuments, deleteDocument, updateNotes, isSupabaseUser,
  type DocumentRecord, type DocumentAnalysis,
} from "@/lib/supabase-documents"

interface StoredDocument {
  id: string
  name: string
  analysis: DocumentAnalysis
  uploadedAt: string
  notes?: string
}

type RiskFilter = "All" | "High" | "Medium" | "Low"

function RiskBar({ score, level }: { score: number; level: string }) {
  const color = level === "Low" ? "bg-green-500" : level === "High" ? "bg-red-500" : "bg-orange-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-8">{score}</span>
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  if (level === "Low")
    return <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 border text-xs"><Shield className="w-3 h-3 mr-1" /> Low</Badge>
  if (level === "High")
    return <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 border text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> High</Badge>
  return <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700 border text-xs"><Shield className="w-3 h-3 mr-1" /> Medium</Badge>
}

function NotesSection({ doc, usingSupabase, lang }: { doc: StoredDocument; usingSupabase: boolean; lang: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(doc.notes ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (val: string) => {
    setText(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (usingSupabase) {
        updateNotes(doc.id, val)
      } else {
        try {
          localStorage.setItem(`nyay_notes_${doc.id}`, val)
        } catch {}
      }
    }, 800)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <StickyNote className="w-3.5 h-3.5" />
        {lang === "hi" ? "नोट्स" : "Notes"}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={lang === "hi" ? "यहाँ अपने नोट्स लिखें..." : "Write your notes here..."}
          rows={3}
          className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
        />
      )}
    </div>
  )
}

function EmptyState({ lang, router }: { lang: string; router: ReturnType<typeof useRouter> }) {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div
        onClick={() => router.push("/upload")}
        className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-green-200 dark:border-green-800 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-lg">
          <Upload className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          {lang === "hi" ? "अभी तक कोई दस्तावेज़ नहीं" : "No documents yet"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 max-w-sm">
          {lang === "hi"
            ? "अपना पहला दस्तावेज़ अपलोड करें — AI तुरंत जोखिम स्कोर, पक्षकार और मुख्य धाराएं दिखाएगा।"
            : "Upload your first document — AI will instantly show risk score, parties and key clauses."}
        </p>
        <Button className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 shadow-lg">
          <Upload className="w-4 h-4 mr-2" /> {t("uploadDoc")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", label: lang === "hi" ? "AI जोखिम स्कोर" : "AI Risk Score", desc: lang === "hi" ? "0-100 जोखिम मूल्यांकन" : "0-100 risk assessment" },
          { icon: Database, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", label: lang === "hi" ? "क्लाउड स्टोरेज" : "Cloud Storage", desc: lang === "hi" ? "सभी डिवाइस पर सिंक" : "Synced across all devices" },
          { icon: Clock, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", label: lang === "hi" ? "मुख्य तारीखें" : "Key Dates", desc: lang === "hi" ? "सभी डेडलाइन auto-detect" : "All deadlines auto-detected" },
        ].map((f) => (
          <div key={f.label} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 ${f.bg} rounded-lg flex items-center justify-center shrink-0`}><f.icon className={`w-5 h-5 ${f.color}`} /></div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-sm">{f.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DocumentHistory() {
  const [docs, setDocs] = useState<StoredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [usingSupabase, setUsingSupabase] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All")
  const router = useRouter()
  const { t, lang } = useLanguage()

  useEffect(() => {
    async function load() {
      const sbUser = await isSupabaseUser()
      if (sbUser) {
        setUsingSupabase(true)
        const sbDocs = await getDocuments()
        setDocs(sbDocs.map((d: DocumentRecord) => ({
          id: d.id, name: d.name, analysis: d.analysis, uploadedAt: d.uploaded_at, notes: d.notes,
        })))
        setLoading(false)
        return
      }
      // localStorage fallback
      const analysis = localStorage.getItem("nyay_document_analysis")
      const name = localStorage.getItem("nyay_document_name")
      const time = localStorage.getItem("nyay_upload_time")
      if (analysis && name) {
        try {
          const id = "local"
          const notes = localStorage.getItem(`nyay_notes_${id}`) ?? undefined
          setDocs([{ id, name, analysis: JSON.parse(analysis), uploadedAt: time ?? new Date().toISOString(), notes }])
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    })

  const handleAskAI = (doc: StoredDocument) => {
    localStorage.setItem("nyay_document_analysis", JSON.stringify(doc.analysis))
    localStorage.setItem("nyay_document_name", doc.name)
    localStorage.setItem("nyay_upload_time", doc.uploadedAt)
    router.push("/chat")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    if (usingSupabase) await deleteDocument(id)
    else {
      localStorage.removeItem("nyay_document_analysis")
      localStorage.removeItem("nyay_document_name")
      localStorage.removeItem("nyay_upload_time")
    }
    setDocs((prev) => prev.filter((d) => d.id !== id))
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (docs.length === 0) return <EmptyState lang={lang} router={router} />

  // Filter
  const filtered = docs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.analysis.document_type.toLowerCase().includes(search.toLowerCase())
    const matchRisk = riskFilter === "All" || d.analysis.risk_level === riskFilter
    return matchSearch && matchRisk
  })

  const totalDocs = docs.length
  const avgRisk = Math.round(docs.reduce((s, d) => s + d.analysis.risk_score, 0) / totalDocs)
  const totalDates = docs.reduce((s, d) => s + d.analysis.key_dates.length, 0)
  const totalRisks = docs.reduce((s, d) => s + d.analysis.risk_factors.length, 0)

  const statCards = [
    { icon: FileText, bg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400", value: String(totalDocs), label: lang === "hi" ? "दस्तावेज़" : "Documents" },
    { icon: TrendingUp, bg: "bg-green-100 dark:bg-green-900/40", iconColor: "text-green-600 dark:text-green-400", value: String(avgRisk), label: lang === "hi" ? "औसत जोखिम" : "Avg Risk" },
    { icon: Clock, bg: "bg-purple-100 dark:bg-purple-900/40", iconColor: "text-purple-600 dark:text-purple-400", value: String(totalDates), label: lang === "hi" ? "कुल तिथियाँ" : "Total Dates" },
    { icon: AlertTriangle, bg: "bg-orange-100 dark:bg-orange-900/40", iconColor: "text-orange-600 dark:text-orange-400", value: String(totalRisks), label: lang === "hi" ? "कुल जोखिम" : "Total Risks" },
  ]

  const riskFilters: { key: RiskFilter; label: string; cls: string }[] = [
    { key: "All", label: lang === "hi" ? "सभी" : "All", cls: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" },
    { key: "High", label: lang === "hi" ? "उच्च" : "High", cls: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
    { key: "Medium", label: lang === "hi" ? "मध्यम" : "Medium", cls: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" },
    { key: "Low", label: lang === "hi" ? "कम" : "Low", cls: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-white dark:bg-gray-800 shadow-sm border-0 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents List */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 dark:border dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-800 dark:text-white flex items-center gap-2">
              {usingSupabase && <Database className="w-4 h-4 text-blue-500" />}
              {lang === "hi" ? "दस्तावेज़ इतिहास" : "Document History"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => router.push("/upload")}
              className="text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
              <Upload className="w-3.5 h-3.5 mr-1" /> {t("newUpload")}
            </Button>
          </div>

          {/* Search + Filter */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "hi" ? "नाम या प्रकार से खोजें..." : "Search by name or type..."}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {riskFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRiskFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${f.cls} ${riskFilter === f.key ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500" : "opacity-70 hover:opacity-100"}`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-gray-400 dark:text-gray-500 self-center ml-auto">
                {filtered.length}/{totalDocs}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
              {lang === "hi" ? "कोई दस्तावेज़ नहीं मिला" : "No documents found"}
            </p>
          ) : (
            filtered.map((doc) => (
              <div key={doc.id} className="border dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(doc.uploadedAt)}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                          {doc.analysis.document_type}
                        </Badge>
                        <RiskBadge level={doc.analysis.risk_level} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleAskAI(doc)}
                      className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      {lang === "hi" ? "पूछें" : "Ask"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t dark:border-gray-700">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">{lang === "hi" ? "जोखिम स्कोर" : "Risk Score"}</p>
                      <RiskBar score={doc.analysis.risk_score} level={doc.analysis.risk_level} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">{t("parties")}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{doc.analysis.parties.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {doc.analysis.key_clauses.slice(0, 1).map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{c}</span>
                      </div>
                    ))}
                    {doc.analysis.risk_factors.slice(0, 1).map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <NotesSection doc={doc} usingSupabase={usingSupabase} lang={lang} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleAskAI(docs[0])}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">{lang === "hi" ? "AI से पूछें" : "Ask AI"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lang === "hi" ? "सबसे हालिया दस्तावेज़" : "Most recent document"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/upload")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">{lang === "hi" ? "नया दस्तावेज़" : "New Document"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lang === "hi" ? "अपलोड और विश्लेषण करें" : "Upload & analyze"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
