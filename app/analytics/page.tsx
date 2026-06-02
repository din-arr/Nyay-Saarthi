"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import {
  BarChart3, Upload, TrendingUp, FileText, AlertTriangle,
  Shield, Loader2, Trophy,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getDocuments, isSupabaseUser, type DocumentRecord } from "@/lib/supabase-documents"

interface DocItem {
  id: string
  name: string
  analysis: {
    document_type: string
    risk_score: number
    risk_level: string
    risk_factors: string[]
    key_dates: string[]
    key_clauses: string[]
    parties: string[]
  }
  uploadedAt: string
}

const RISK_COLORS = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 dark:text-white">{payload[0].name}</p>
      <p className="text-gray-500 dark:text-gray-400">{payload[0].value} document{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { lang } = useLanguage()
  const hi = lang === "hi"

  useEffect(() => {
    async function load() {
      const sbDocs = await getDocuments()
      if (sbDocs.length > 0) {
        setDocs(sbDocs.map((d: DocumentRecord) => ({ id: d.id, name: d.name, analysis: d.analysis, uploadedAt: d.uploaded_at })))
      } else {
        try {
          const raw = localStorage.getItem("nyay_documents")
          if (raw) setDocs(JSON.parse(raw))
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-5 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hi ? "विश्लेषण" : "Analytics"}</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {hi ? "Analytics देखने के लिए कम से कम एक दस्तावेज़ अपलोड करें।" : "Upload at least one document to see analytics."}
          </p>
          <Button onClick={() => router.push("/upload")} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8">
            <Upload className="w-4 h-4 mr-2" /> {hi ? "दस्तावेज़ अपलोड करें" : "Upload Document"}
          </Button>
        </div>
      </div>
    )
  }

  // Compute analytics
  const totalDocs = docs.length
  const avgRisk = Math.round(docs.reduce((s, d) => s + d.analysis.risk_score, 0) / totalDocs)
  const highCount = docs.filter((d) => d.analysis.risk_level === "High").length
  const medCount = docs.filter((d) => d.analysis.risk_level === "Medium").length
  const lowCount = docs.filter((d) => d.analysis.risk_level === "Low").length

  const riskPieData = [
    { name: hi ? "उच्च जोखिम" : "High Risk", value: highCount, color: RISK_COLORS.High },
    { name: hi ? "मध्यम जोखिम" : "Medium Risk", value: medCount, color: RISK_COLORS.Medium },
    { name: hi ? "कम जोखिम" : "Low Risk", value: lowCount, color: RISK_COLORS.Low },
  ].filter((d) => d.value > 0)

  // Document type distribution
  const typeCounts: Record<string, number> = {}
  docs.forEach((d) => { typeCounts[d.analysis.document_type] = (typeCounts[d.analysis.document_type] ?? 0) + 1 })
  const typeData = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + "…" : name, value, fullName: name }))

  // Risk score bar data (last 8 docs)
  const scoreData = [...docs].slice(0, 8).reverse().map((d, i) => ({
    name: d.name.length > 12 ? d.name.slice(0, 10) + "…" : d.name,
    score: d.analysis.risk_score,
    fill: RISK_COLORS[d.analysis.risk_level as keyof typeof RISK_COLORS] ?? RISK_COLORS.Medium,
  }))

  // Top risk factors across all docs
  const factorMap: Record<string, number> = {}
  docs.forEach((d) => d.analysis.risk_factors.forEach((f) => { factorMap[f] = (factorMap[f] ?? 0) + 1 }))
  const topFactors = Object.entries(factorMap).sort(([, a], [, b]) => b - a).slice(0, 5)

  // Highest / lowest risk docs
  const sorted = [...docs].sort((a, b) => b.analysis.risk_score - a.analysis.risk_score)
  const riskiest = sorted[0]
  const safest = sorted[sorted.length - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "दस्तावेज़ Analytics" : "Document Analytics"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? `${totalDocs} दस्तावेज़ों का विश्लेषण` : `Analysis across ${totalDocs} document${totalDocs !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, bg: "bg-blue-100 dark:bg-blue-900/40", ic: "text-blue-600 dark:text-blue-400", val: String(totalDocs), label: hi ? "कुल दस्तावेज़" : "Total Docs" },
            { icon: TrendingUp, bg: "bg-green-100 dark:bg-green-900/40", ic: "text-green-600 dark:text-green-400", val: String(avgRisk), label: hi ? "औसत जोखिम" : "Avg Risk Score" },
            { icon: AlertTriangle, bg: "bg-red-100 dark:bg-red-900/40", ic: "text-red-600 dark:text-red-400", val: String(highCount), label: hi ? "उच्च जोखिम" : "High Risk Docs" },
            { icon: Shield, bg: "bg-emerald-100 dark:bg-emerald-900/40", ic: "text-emerald-600 dark:text-emerald-400", val: String(lowCount), label: hi ? "सुरक्षित दस्तावेज़" : "Safe Docs" },
          ].map((s) => (
            <Card key={s.label} className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.ic}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Risk Distribution Pie */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 dark:text-white">
                {hi ? "जोखिम वितरण" : "Risk Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {riskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {riskPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Types Bar */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 dark:text-white">
                {hi ? "दस्तावेज़ प्रकार" : "Document Types"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData} layout="vertical" margin={{ left: 4, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Risk Score Trend */}
        {scoreData.length > 1 && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 dark:text-white">
                {hi ? "दस्तावेज़-वार जोखिम स्कोर" : "Risk Score per Document"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreData} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => [`${v}/100`, hi ? "जोखिम स्कोर" : "Risk Score"]} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {scoreData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bottom Row: Top Risk Factors + Best/Worst docs */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Top Risk Factors */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {hi ? "शीर्ष जोखिम कारक" : "Top Risk Factors"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topFactors.length === 0 ? (
                <p className="text-xs text-gray-400">{hi ? "कोई जोखिम नहीं मिला" : "No risk factors found"}</p>
              ) : (
                topFactors.map(([factor, count], i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-red-400 w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{factor}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${(count / totalDocs) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{count}x</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Best vs Riskiest */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {hi ? "तुलनात्मक सारांश" : "Notable Documents"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {hi ? "सबसे सुरक्षित" : "Safest"}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{safest?.name}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    {hi ? `जोखिम स्कोर: ${safest?.analysis.risk_score}` : `Risk score: ${safest?.analysis.risk_score}`}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {hi ? "सबसे जोखिम भरा" : "Highest Risk"}
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{riskiest?.name}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {hi ? `जोखिम स्कोर: ${riskiest?.analysis.risk_score}` : `Risk score: ${riskiest?.analysis.risk_score}`}
                  </p>
                </div>
              </div>
              <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white" onClick={() => router.push("/compare")}>
                {hi ? "दस्तावेज़ तुलना करें" : "Compare Documents"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
