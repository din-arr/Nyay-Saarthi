"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Clock, AlertTriangle, CheckCircle2, Upload,
  FileText, CalendarClock,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface DocumentAnalysis {
  document_type: string
  key_dates: string[]
  risk_level: string
  parties: string[]
}

// Attempt to parse a date from a free-form string returned by the LLM
function tryParseDate(raw: string): Date | null {
  // Try standard Date parsing first
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d
  // Try extracting date portion with regex
  const match = raw.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i)
  if (match) {
    const d2 = new Date(match[0])
    if (!isNaN(d2.getTime())) return d2
  }
  return null
}

function getStatus(date: Date | null): "past" | "soon" | "future" | "unknown" {
  if (!date) return "unknown"
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  if (diff < 0) return "past"
  if (diff < 30 * 24 * 60 * 60 * 1000) return "soon"
  return "future"
}

function relativeLabel(date: Date | null, lang: string): string {
  if (!date) return ""
  const now = new Date()
  const diff = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return lang === "hi" ? `${Math.abs(diff)} दिन पहले` : `${Math.abs(diff)} days ago`
  if (diff === 0) return lang === "hi" ? "आज" : "Today"
  if (diff === 1) return lang === "hi" ? "कल" : "Tomorrow"
  return lang === "hi" ? `${diff} दिन में` : `In ${diff} days`
}

const statusConfig = {
  past: {
    dot: "bg-gray-400 dark:bg-gray-500",
    line: "bg-gray-200 dark:bg-gray-700",
    badge: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: CheckCircle2,
    iconColor: "text-gray-400",
  },
  soon: {
    dot: "bg-orange-500",
    line: "bg-orange-200 dark:bg-orange-900/40",
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700",
    icon: AlertTriangle,
    iconColor: "text-orange-500",
  },
  future: {
    dot: "bg-blue-500",
    line: "bg-blue-100 dark:bg-blue-900/30",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
    icon: Calendar,
    iconColor: "text-blue-500",
  },
  unknown: {
    dot: "bg-purple-500",
    line: "bg-purple-100 dark:bg-purple-900/30",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700",
    icon: Clock,
    iconColor: "text-purple-500",
  },
}

export default function TimelinePage() {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [docName, setDocName] = useState("")
  const router = useRouter()
  const { lang } = useLanguage()
  const hi = lang === "hi"

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nyay_document_analysis")
      const name = localStorage.getItem("nyay_document_name")
      if (raw) setAnalysis(JSON.parse(raw))
      if (name) setDocName(name)
    } catch {}
  }, [])

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-5 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CalendarClock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {hi ? "समयरेखा" : "Timeline"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {hi ? "समयरेखा देखने के लिए पहले कोई दस्तावेज़ अपलोड करें।" : "Upload a document first to view its deadline timeline."}
          </p>
          <Button onClick={() => router.push("/upload")}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8">
            <Upload className="w-4 h-4 mr-2" />
            {hi ? "दस्तावेज़ अपलोड करें" : "Upload Document"}
          </Button>
        </div>
      </div>
    )
  }

  const items = analysis.key_dates.map((raw) => {
    const date = tryParseDate(raw)
    const status = getStatus(date)
    const rel = relativeLabel(date, lang)
    return { raw, date, status, rel }
  })

  const soon = items.filter((i) => i.status === "soon").length
  const future = items.filter((i) => i.status === "future").length
  const past = items.filter((i) => i.status === "past").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "स्मार्ट समयरेखा" : "Smart Deadline Tracker"}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{docName}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: hi ? "समाप्त" : "Past", val: past, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
            { label: hi ? "जल्द आने वाले" : "Due Soon", val: soon, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { label: hi ? "आगामी" : "Upcoming", val: future, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border dark:border-gray-700 rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {[
            { label: hi ? "समाप्त" : "Past", dot: "bg-gray-400" },
            { label: hi ? "30 दिन में" : "Due in 30 days", dot: "bg-orange-500" },
            { label: hi ? "आगामी" : "Upcoming", dot: "bg-blue-500" },
            { label: hi ? "तारीख अज्ञात" : "Unknown date", dot: "bg-purple-500" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-800 dark:text-white">
              {hi ? `${items.length} महत्वपूर्ण तिथियाँ` : `${items.length} Key Dates`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />

              <div className="space-y-6">
                {items.map((item, i) => {
                  const cfg = statusConfig[item.status]
                  const Icon = cfg.icon
                  return (
                    <div key={i} className="relative flex items-start gap-4 pl-10">
                      {/* Dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${cfg.dot} ring-2 ring-white dark:ring-gray-800 z-10 mt-1`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Icon className={`w-4 h-4 ${cfg.iconColor} shrink-0 mt-0.5`} />
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{item.raw}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {item.date && (
                              <Badge className={`border text-xs ${cfg.badge}`}>
                                {item.date.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </Badge>
                            )}
                            {item.rel && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">{item.rel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning banner for soon items */}
        {soon > 0 && (
          <div className="mt-6 flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-400">
              {hi
                ? `${soon} तिथि ${soon === 1 ? "है" : "हैं"} जो 30 दिनों में आने वाली ${soon === 1 ? "है" : "हैं"} — समय रहते कार्रवाई करें।`
                : `${soon} deadline${soon > 1 ? "s" : ""} due within 30 days — take action soon.`}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/chat")}
            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
            {hi ? "AI से पूछें" : "Ask AI"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/upload")}
            className="dark:border-gray-600 dark:text-gray-300">
            {hi ? "नया दस्तावेज़" : "New Document"}
          </Button>
        </div>
      </div>
    </div>
  )
}
