"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle2, BellOff } from "lucide-react"
import { getDocuments } from "@/lib/supabase-documents"

interface DeadlineItem {
  raw: string
  docName: string
  date: Date | null
  daysLeft: number | null
  status: "overdue" | "critical" | "soon" | "future"
}

function tryParseDate(raw: string): Date | null {
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d
  const match = raw.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i)
  if (match) { const d2 = new Date(match[0]); if (!isNaN(d2.getTime())) return d2 }
  return null
}

function getStatus(days: number | null): DeadlineItem["status"] {
  if (days === null) return "future"
  if (days < 0) return "overdue"
  if (days <= 7) return "critical"
  if (days <= 30) return "soon"
  return "future"
}

const statusStyle: Record<DeadlineItem["status"], { badge: string; dot: string; label: (hi: boolean, days: number | null) => string }> = {
  overdue: {
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
    dot: "bg-red-500",
    label: (hi, days) => hi ? `${Math.abs(days ?? 0)} दिन पहले` : `${Math.abs(days ?? 0)}d overdue`,
  },
  critical: {
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700",
    dot: "bg-orange-500",
    label: (hi, days) => hi ? `${days} दिन में` : `In ${days}d`,
  },
  soon: {
    badge: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
    dot: "bg-yellow-500",
    label: (hi, days) => hi ? `${days} दिन में` : `In ${days}d`,
  },
  future: {
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
    dot: "bg-blue-400",
    label: (hi, days) => days !== null ? (hi ? `${days} दिन में` : `In ${days}d`) : (hi ? "अज्ञात" : "Unknown"),
  },
}

export function ExpiryAlerts({ lang }: { lang: string }) {
  const hi = lang === "hi"
  const [items, setItems] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function load() {
      let docs = await getDocuments()
      if (docs.length === 0) {
        try {
          const raw = localStorage.getItem("nyay_documents")
          if (raw) docs = JSON.parse(raw)
        } catch {}
      }
      const now = new Date()
      const deadlines: DeadlineItem[] = []

      for (const doc of docs) {
        for (const raw of (doc.analysis?.key_dates ?? [])) {
          const date = tryParseDate(raw)
          const daysLeft = date ? Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
          const status = getStatus(daysLeft)
          // Only include items within 90 days future or any overdue
          if (daysLeft === null || daysLeft < 0 || daysLeft <= 90) {
            deadlines.push({ raw, docName: doc.name, date, daysLeft, status })
          }
        }
      }

      // Sort: overdue first, then critical, then soon, then future
      const order = { overdue: 0, critical: 1, soon: 2, future: 3 }
      deadlines.sort((a, b) => {
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
        return (a.daysLeft ?? 999) - (b.daysLeft ?? 999)
      })

      setItems(deadlines)
      setLoading(false)

      // Browser notifications for critical items
      if (Notification.permission === "granted") {
        setNotifEnabled(true)
        const urgent = deadlines.filter(d => d.status === "critical" || d.status === "overdue")
        if (urgent.length > 0) {
          const alerted = sessionStorage.getItem("nyay_notif_alerted")
          if (!alerted) {
            new Notification(hi ? "⚠️ दस्तावेज़ समय सीमा अलर्ट" : "⚠️ Document Deadline Alert", {
              body: hi
                ? `${urgent.length} दस्तावेज़ समय सीमा जल्द आ रही है!`
                : `${urgent.length} document deadline(s) require attention!`,
              icon: "/favicon.svg",
            })
            sessionStorage.setItem("nyay_notif_alerted", "1")
          }
        }
      }
    }
    load()
  }, [hi])

  const requestNotifications = async () => {
    const perm = await Notification.requestPermission()
    setNotifEnabled(perm === "granted")
  }

  if (loading) return null

  const urgent = items.filter(i => i.status === "overdue" || i.status === "critical")
  const visible = showAll ? items : items.slice(0, 5)

  if (items.length === 0) return null

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            {hi ? "समय सीमा अलर्ट" : "Deadline Alerts"}
            {urgent.length > 0 && (
              <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 border text-xs">
                {urgent.length} {hi ? "तत्काल" : "urgent"}
              </Badge>
            )}
          </CardTitle>
          {!notifEnabled && (
            <Button size="sm" variant="outline" onClick={requestNotifications}
              className="text-xs border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 gap-1">
              <Bell className="w-3 h-3" />
              {hi ? "अलर्ट चालू करें" : "Enable Alerts"}
            </Button>
          )}
          {notifEnabled && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />{hi ? "अलर्ट चालू" : "Alerts on"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((item, i) => {
          const cfg = statusStyle[item.status]
          const Icon = item.status === "overdue" ? AlertTriangle : item.status === "critical" ? Clock : item.status === "soon" ? Calendar : Calendar
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.docName}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{item.raw}</p>
              </div>
              <Badge className={`border text-xs shrink-0 ${cfg.badge}`}>
                <Icon className="w-3 h-3 mr-1" />
                {cfg.label(hi, item.daysLeft)}
              </Badge>
            </div>
          )
        })}
        {items.length > 5 && (
          <button onClick={() => setShowAll(v => !v)}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1">
            {showAll
              ? (hi ? "कम दिखाएं" : "Show less")
              : (hi ? `${items.length - 5} और देखें` : `Show ${items.length - 5} more`)}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
