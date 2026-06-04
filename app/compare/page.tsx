"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload, FileText, Shield, TrendingUp, CheckCircle, XCircle,
  Trophy, Users, Calendar, GitCompare, Loader2, Bot, ChevronDown, ChevronUp,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getDocuments, isSupabaseUser } from "@/lib/supabase-documents"
import { apiUrl } from "@/lib/api"

interface DocumentAnalysis {
  document_type: string
  parties: string[]
  key_dates: string[]
  key_clauses: string[]
  risk_score: number
  risk_level: "Low" | "Medium" | "High"
  risk_factors: string[]
  suggested_questions: string[]
}

interface StoredDoc {
  id: string
  name: string
  analysis: DocumentAnalysis
  uploadedAt: string
}

function RiskChip({ level }: { level: string }) {
  const map: Record<string, string> = {
    Low: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700",
    High: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
    Medium: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700",
  }
  return (
    <Badge className={`border text-xs ${map[level] ?? map.Medium}`}>
      <Shield className="w-3 h-3 mr-1" />{level}
    </Badge>
  )
}

function ScoreBar({ score, level, winner }: { score: number; level: string; winner: boolean }) {
  const color = level === "Low" ? "bg-green-500" : level === "High" ? "bg-red-500" : "bg-orange-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10">{score}</span>
      {winner && <Trophy className="w-4 h-4 text-yellow-500" />}
    </div>
  )
}

function DocColumn({ doc, isWinner, lang }: { doc: StoredDoc; isWinner: boolean; lang: string }) {
  const { analysis } = doc
  return (
    <div className={`space-y-3 flex-1 min-w-0 ${isWinner ? "ring-2 ring-green-400 dark:ring-green-600 rounded-xl p-1" : ""}`}>
      {isWinner && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-green-700 dark:text-green-400">
            {lang === "hi" ? "कम जोखिम — बेहतर दस्तावेज़" : "Lower Risk — Better Document"}
          </span>
        </div>
      )}
      <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{doc.name}</p>
              <Badge variant="secondary" className="mt-1 text-xs dark:bg-gray-700 dark:text-gray-300">{analysis.document_type}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{lang === "hi" ? "जोखिम स्कोर" : "Risk Score"}</p>
            <RiskChip level={analysis.risk_level} />
          </div>
          <ScoreBar score={analysis.risk_score} level={analysis.risk_level} winner={isWinner} />
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{lang === "hi" ? "पक्षकार" : "Parties"}</p>
          </div>
          {analysis.parties.slice(0, 3).map((p, i) => (
            <p key={i} className="text-xs text-gray-700 dark:text-gray-300 truncate">• {p}</p>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{lang === "hi" ? "मुख्य तिथियाँ" : "Key Dates"}</p>
          </div>
          {analysis.key_dates.slice(0, 3).map((d, i) => (
            <p key={i} className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">• {d}</p>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
        <CardContent className="p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{lang === "hi" ? "क्लॉज़ और जोखिम" : "Clauses & Risks"}</p>
          {analysis.key_clauses.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{c}</span>
            </div>
          ))}
          {analysis.risk_factors.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{r}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: lang === "hi" ? "तिथियाँ" : "Dates", val: analysis.key_dates.length, color: "text-purple-600 dark:text-purple-400" },
          { label: lang === "hi" ? "धाराएँ" : "Clauses", val: analysis.key_clauses.length, color: "text-blue-600 dark:text-blue-400" },
          { label: lang === "hi" ? "जोखिम" : "Risks", val: analysis.risk_factors.length, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-2 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DocSelector({ docs, selected, onSelect, label, excluded }: {
  docs: StoredDoc[]; selected: string | null; onSelect: (id: string) => void; label: string; excluded: string | null
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {docs.map((doc) => {
          const isExcluded = doc.id === excluded
          return (
            <button
              key={doc.id}
              onClick={() => !isExcluded && onSelect(doc.id)}
              disabled={isExcluded}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                selected === doc.id
                  ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 shadow-sm"
                  : isExcluded
                  ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-40 cursor-not-allowed"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{doc.analysis.document_type}</span>
                    <RiskChip level={doc.analysis.risk_level} />
                  </div>
                </div>
                {selected === doc.id && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [docs, setDocs] = useState<StoredDoc[]>([])
  const [selectedA, setSelectedA] = useState<string | null>(null)
  const [selectedB, setSelectedB] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [showFeedback, setShowFeedback] = useState(true)
  const router = useRouter()
  const { lang } = useLanguage()
  const hi = lang === "hi"

  useEffect(() => {
    async function load() {
      const sbDocs = await getDocuments()
      if (sbDocs.length > 0) {
        setDocs(sbDocs.map((d) => ({ id: d.id, name: d.name, analysis: d.analysis, uploadedAt: d.uploaded_at })))
      } else {
        try {
          const raw = localStorage.getItem("nyay_documents")
          if (raw) setDocs(JSON.parse(raw))
        } catch {}
      }
    }
    load()
  }, [])

  const docA = docs.find((d) => d.id === selectedA) ?? null
  const docB = docs.find((d) => d.id === selectedB) ?? null
  const canCompare = !!(docA && docB)
  const winnerA = canCompare && docA!.analysis.risk_score <= docB!.analysis.risk_score

  const handleCompare = async () => {
    if (!canCompare) return
    setComparing(true)
    setAiFeedback("")
    setLoadingFeedback(true)
    try {
      const res = await fetch(apiUrl("/ai-compare/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_a_name: docA!.name,
          doc_a_analysis: docA!.analysis,
          doc_b_name: docB!.name,
          doc_b_analysis: docB!.analysis,
          language: lang,
        }),
      })
      const data = await res.json()
      setAiFeedback(data.feedback ?? "")
    } catch {
      setAiFeedback(hi ? "AI फ़ीडबैक प्राप्त करने में त्रुटि हुई।" : "Could not get AI feedback.")
    } finally {
      setLoadingFeedback(false)
    }
  }

  if (docs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <GitCompare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hi ? "दस्तावेज़ तुलना" : "Document Comparison"}</h1>
          <p className="text-gray-500 dark:text-gray-400">{hi ? "तुलना के लिए कम से कम 2 दस्तावेज़ चाहिए।" : "Upload at least 2 documents to compare."}</p>
          <Button onClick={() => router.push("/upload")} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8">
            <Upload className="w-4 h-4 mr-2" />{hi ? "दस्तावेज़ अपलोड करें" : "Upload Document"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hi ? "दस्तावेज़ तुलना" : "Document Comparison"}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? "दो दस्तावेज़ चुनें और AI से विस्तृत तुलना करवाएं" : "Select two documents for an AI-powered side-by-side comparison"}
          </p>
        </div>

        {/* Selector panel */}
        {!comparing && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 dark:text-white">{hi ? "तुलना के लिए दस्तावेज़ चुनें" : "Select Documents to Compare"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 flex-col sm:flex-row">
                <DocSelector docs={docs} selected={selectedA} onSelect={setSelectedA} excluded={selectedB}
                  label={hi ? "📄 दस्तावेज़ A" : "📄 Document A"} />
                <div className="flex items-center justify-center shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">VS</span>
                  </div>
                </div>
                <DocSelector docs={docs} selected={selectedB} onSelect={setSelectedB} excluded={selectedA}
                  label={hi ? "📄 दस्तावेज़ B" : "📄 Document B"} />
              </div>
              <Button onClick={handleCompare} disabled={!canCompare}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-40">
                <GitCompare className="w-4 h-4 mr-2" />
                {hi ? "AI तुलना शुरू करें" : "Start AI Comparison"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comparison result */}
        {comparing && docA && docB && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl px-4 py-2 text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{docA.name}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white text-xs font-bold">VS</span>
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl px-4 py-2 text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{docB.name}</p>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <DocColumn doc={docA} isWinner={winnerA as boolean} lang={lang} />
              <DocColumn doc={docB} isWinner={!winnerA} lang={lang} />
            </div>

            {/* AI Feedback */}
            <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {hi ? "AI विश्लेषण और सिफ़ारिश" : "AI Analysis & Recommendation"}
                  </CardTitle>
                  <button onClick={() => setShowFeedback((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </CardHeader>
              {showFeedback && (
                <CardContent>
                  {loadingFeedback ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {hi ? "AI दोनों दस्तावेज़ों का विश्लेषण कर रहा है..." : "AI is analyzing both documents..."}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{aiFeedback}</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Summary */}
            <Card className="mb-6 bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {hi ? "तुलना सारांश" : "Comparison Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{hi ? "जोखिम अंतर" : "Risk Difference"}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.abs(docA.analysis.risk_score - docB.analysis.risk_score)}</p>
                    <p className="text-xs text-gray-400">{hi ? "अंक" : "points"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{hi ? "बेहतर दस्तावेज़" : "Better Document"}</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400 truncate">{winnerA ? docA.name : docB.name}</p>
                    <p className="text-xs text-gray-400">{hi ? "कम जोखिम" : "lower risk"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{hi ? "कुल जोखिम कारक" : "Total Risk Factors"}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{docA.analysis.risk_factors.length + docB.analysis.risk_factors.length}</p>
                    <p className="text-xs text-gray-400">{hi ? "दोनों में" : "across both"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" onClick={() => { setComparing(false); setAiFeedback("") }}
                className="border-blue-400 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                <GitCompare className="w-4 h-4 mr-2" />{hi ? "नई तुलना" : "New Comparison"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/upload")}
                className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                <Upload className="w-4 h-4 mr-2" />{hi ? "नया दस्तावेज़" : "New Document"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="dark:border-gray-600 dark:text-gray-300">
                {hi ? "डैशबोर्ड" : "Dashboard"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
