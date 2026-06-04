"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle, Shield, Upload, Loader2, ChevronDown, ChevronUp,
  FileText, Scale, Lightbulb, CheckCircle, RefreshCw,
} from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { getDocuments } from "@/lib/supabase-documents"

interface RedFlag {
  clause: string
  issue: string
  law: string
  severity: "Critical" | "High" | "Medium"
  suggestion: string
}

interface Negotiation {
  clause: string
  result: string
  loading: boolean
}

const severityConfig = {
  Critical: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-300 dark:border-red-700", badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700", icon: "text-red-500" },
  High: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700", icon: "text-orange-500" },
  Medium: { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-700", badge: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700", icon: "text-yellow-500" },
}

export default function RedFlagsPage() {
  const { lang } = useLanguage()
  const hi = lang === "hi"
  const router = useRouter()

  const [docName, setDocName] = useState("")
  const [allDocs, setAllDocs] = useState<{ id: string; name: string }[]>([])
  const [scanning, setScanning] = useState(false)
  const [redFlags, setRedFlags] = useState<RedFlag[]>([])
  const [scanned, setScanned] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [negotiations, setNegotiations] = useState<Record<number, Negotiation>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      let docs = await getDocuments()
      if (docs.length === 0) {
        try {
          const raw = localStorage.getItem("nyay_documents")
          if (raw) docs = JSON.parse(raw)
        } catch {}
      }
      setAllDocs(docs.map((d: any) => ({ id: d.id, name: d.name })))
      // Pre-select last uploaded doc name from session cache
      const name = localStorage.getItem("nyay_document_name")
      if (name) setDocName(name)
      else if (docs.length > 0) setDocName(docs[0].name)
    }
    load()
  }, [])

  const handleScan = async () => {
    setScanning(true)
    setRedFlags([])
    setScanned(false)
    setError("")
    setNegotiations({})
    try {
      const res = await fetch(apiUrl("/scan-red-flags/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setScanned(true); return }
      setRedFlags(Array.isArray(data.red_flags) ? data.red_flags : [])
      setScanned(true)
    } catch {
      setError(hi ? "सर्वर से जुड़ने में त्रुटि।" : "Could not connect to server.")
      setScanned(true)
    } finally {
      setScanning(false)
    }
  }

  const handleNegotiate = async (index: number, clause: string) => {
    setNegotiations(prev => ({ ...prev, [index]: { clause, result: "", loading: true } }))
    try {
      const res = await fetch(apiUrl("/negotiate-clause/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clause, language: lang }),
      })
      const data = await res.json()
      setNegotiations(prev => ({ ...prev, [index]: { clause, result: data.suggestion ?? "", loading: false } }))
    } catch {
      setNegotiations(prev => ({ ...prev, [index]: { clause, result: hi ? "त्रुटि हुई।" : "Error occurred.", loading: false } }))
    }
  }

  const critical = redFlags.filter(f => f.severity === "Critical").length
  const high = redFlags.filter(f => f.severity === "High").length
  const medium = redFlags.filter(f => f.severity === "Medium").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "अनुबंध रेड-फ्लैग स्कैनर" : "Contract Red-Flag Scanner"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? "भारतीय कानून के तहत अवैध, अनुचित या असामान्य धाराओं को खोजें" : "Hunt for illegal, unfair, or non-standard clauses under Indian law"}
          </p>
        </div>

        {/* Doc info + scan button */}
        <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{hi ? "वर्तमान दस्तावेज़" : "Current document (last uploaded)"}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {docName || (hi ? "कोई दस्तावेज़ लोड नहीं" : "No document loaded")}
                  </p>
                </div>
              </div>
              {!docName ? (
                <Button onClick={() => router.push("/upload")} className="bg-green-600 hover:bg-green-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />{hi ? "अपलोड करें" : "Upload First"}
                </Button>
              ) : (
                <Button onClick={handleScan} disabled={scanning}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold">
                  {scanning
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{hi ? "स्कैन हो रहा है..." : "Scanning..."}</>
                    : scanned
                    ? <><RefreshCw className="w-4 h-4 mr-2" />{hi ? "फिर स्कैन करें" : "Re-scan"}</>
                    : <><Shield className="w-4 h-4 mr-2" />{hi ? "रेड-फ्लैग स्कैन करें" : "Scan for Red Flags"}</>
                  }
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results summary */}
        {scanned && !error && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: hi ? "गंभीर" : "Critical", count: critical, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
                { label: hi ? "उच्च" : "High", count: high, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
                { label: hi ? "मध्यम" : "Medium", count: medium, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {redFlags.length === 0 ? (
              <Card className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    {hi ? "कोई रेड-फ्लैग नहीं मिला!" : "No red flags found!"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {hi ? "यह दस्तावेज़ भारतीय कानून के अनुसार उचित प्रतीत होता है।" : "This document appears fair under Indian law."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {hi ? `${redFlags.length} समस्याएं मिलीं:` : `${redFlags.length} issues found:`}
                </p>
                {redFlags.map((flag, i) => {
                  const cfg = severityConfig[flag.severity] ?? severityConfig.Medium
                  const neg = negotiations[i]
                  return (
                    <Card key={i} className={`border ${cfg.border} ${cfg.bg}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.icon}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge className={`border text-xs ${cfg.badge}`}>{flag.severity}</Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{flag.law}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{flag.issue}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{flag.clause}"</p>
                            </div>
                          </div>
                          <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {expanded[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Suggestion */}
                        {flag.suggestion && (
                          <div className="flex items-start gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-2 mb-3">
                            <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{flag.suggestion}</p>
                          </div>
                        )}

                        {/* Negotiation panel */}
                        {expanded[i] && (
                          <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                            {!neg ? (
                              <Button size="sm" variant="outline" onClick={() => handleNegotiate(i, flag.clause)}
                                className="text-xs border-blue-400 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                                <Scale className="w-3.5 h-3.5 mr-1" />
                                {hi ? "वैकल्पिक भाषा सुझाएं" : "Suggest Alternative Wording"}
                              </Button>
                            ) : neg.loading ? (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {hi ? "AI वैकल्पिक शब्द तैयार कर रहा है..." : "AI is drafting alternative wording..."}
                              </div>
                            ) : (
                              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                                  <Scale className="w-3.5 h-3.5" />
                                  {hi ? "वार्ता सुझाव" : "Negotiation Suggestion"}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{neg.result}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
