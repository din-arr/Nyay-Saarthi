"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Upload, FileText, CheckCircle, X, AlertCircle,
  Users, Calendar, AlertTriangle, Lightbulb, Shield, MessageSquare, ArrowRight, Download,
  Volume2, VolumeX, HelpCircle, Loader2,
} from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { exportAnalysisPdf } from "@/lib/export-pdf"
import { saveDocument } from "@/lib/supabase-documents"

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

interface VerificationReport {
  missing_signatures: string[]
  inconsistent_dates: string[]
  clause_mismatches: string[]
  overall_status: "Valid" | "Issues Found" | "Needs Review" | "No Document"
  recommendations: string[]
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
  analysis?: DocumentAnalysis
  verification?: VerificationReport
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = level === "Low" ? "text-green-600 dark:text-green-400" : level === "High" ? "text-red-600 dark:text-red-400" : "text-orange-500 dark:text-orange-400"
  const barColor = level === "Low" ? "bg-green-500" : level === "High" ? "bg-red-500" : "bg-orange-500"
  const bgColor = level === "Low"
    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    : level === "High"
    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Level</span>
        <span className={`text-2xl font-bold ${color}`}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${color}`} />
        <span className={`text-sm font-bold ${color}`}>{level} Risk</span>
      </div>
    </div>
  )
}

function AnalysisSummary({
  analysis, verification, fileName, onGoToChat,
}: {
  analysis: DocumentAnalysis
  verification?: VerificationReport
  fileName: string
  onGoToChat: () => void
}) {
  const { t, lang } = useLanguage()
  const [exporting, setExporting] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [explanations, setExplanations] = useState<Record<string, { loading: boolean; text: string }>>({})

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAnalysisPdf(fileName, analysis)
    } finally {
      setExporting(false)
    }
  }

  const handleVoice = () => {
    if (!("speechSynthesis" in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text =
      lang === "hi"
        ? `दस्तावेज़ प्रकार: ${analysis.document_type}. जोखिम स्कोर: ${analysis.risk_score} में से 100, ${analysis.risk_level} जोखिम. पक्षकार: ${analysis.parties.join(", ")}. मुख्य धाराएं: ${analysis.key_clauses.slice(0, 2).join(". ")}. जोखिम कारक: ${analysis.risk_factors.slice(0, 2).join(". ")}.`
        : `Document type: ${analysis.document_type}. Risk score: ${analysis.risk_score} out of 100, ${analysis.risk_level} risk. Parties: ${analysis.parties.join(", ")}. Key clauses: ${analysis.key_clauses.slice(0, 2).join(". ")}. Risk factors: ${analysis.risk_factors.slice(0, 2).join(". ")}.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN"
    utterance.rate = 0.88
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const explainClause = async (text: string, key: string) => {
    if (explanations[key]) {
      setExplanations((prev) => { const n = { ...prev }; delete n[key]; return n })
      return
    }
    setExplanations((prev) => ({ ...prev, [key]: { loading: true, text: "" } }))
    try {
      const res = await fetch(apiUrl("/explain/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      })
      const data = await res.json()
      setExplanations((prev) => ({ ...prev, [key]: { loading: false, text: data.explanation ?? "" } }))
    } catch {
      setExplanations((prev) => ({ ...prev, [key]: { loading: false, text: lang === "hi" ? "व्याख्या लोड नहीं हो सकी।" : "Could not load explanation." } }))
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {lang === 'hi' ? 'AI विश्लेषण परिणाम' : 'AI Analysis Results'}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-sm px-3 py-1">
            {analysis.document_type}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleVoice}
            className={speaking
              ? "border-red-400 text-red-600 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "border-blue-400 text-blue-600 dark:text-blue-400 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"}
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5 mr-1" /> : <Volume2 className="w-3.5 h-3.5 mr-1" />}
            {speaking ? (lang === 'hi' ? 'बंद करें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="border-purple-400 text-purple-600 dark:text-purple-400 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {exporting ? (lang === 'hi' ? 'बनाया जा रहा है...' : 'Exporting...') : (lang === 'hi' ? 'PDF रिपोर्ट' : 'PDF Report')}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RiskGauge score={analysis.risk_score} level={analysis.risk_level} />

        <div className="rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('parties')}</span>
          </div>
          <div className="space-y-1">
            {analysis.parties.map((party, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{party}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('keyDates')}</span>
          </div>
          <div className="space-y-1">
            {analysis.key_dates.map((date, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('riskFactors')}</span>
          </div>
          <div className="space-y-2">
            {analysis.risk_factors.map((risk, i) => {
              const key = `risk-${i}`
              const exp = explanations[key]
              return (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{risk}</span>
                    <button
                      onClick={() => explainClause(risk, key)}
                      title={lang === 'hi' ? 'सरल भाषा में समझाएं' : 'Explain in plain language'}
                      className="shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      {exp?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3 h-3" />}
                    </button>
                  </div>
                  {exp && !exp.loading && exp.text && (
                    <div className="mt-1 ml-4 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
                      {exp.text}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('clauses')}</span>
        </div>
        <div className="space-y-2">
          {analysis.key_clauses.map((clause, i) => {
            const key = `clause-${i}`
            const exp = explanations[key]
            return (
              <div key={i} className="p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{clause}</span>
                  <button
                    onClick={() => explainClause(clause, key)}
                    title={lang === 'hi' ? 'सरल भाषा में समझाएं' : 'Explain in plain language'}
                    className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    {exp?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3 h-3" />}
                  </button>
                </div>
                {exp && !exp.loading && exp.text && (
                  <div className="mt-2 ml-5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                    {exp.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {verification && (
        <div className="rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {lang === 'hi' ? 'दस्तावेज़ सत्यापन' : 'Document Verification'}
            </span>
            <Badge variant="secondary" className="ml-auto bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
              {verification.overall_status}
            </Badge>
          </div>
          <div className="space-y-2">
            {[...verification.missing_signatures, ...verification.inconsistent_dates, ...verification.clause_mismatches, ...verification.recommendations]
              .filter(Boolean).slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('suggestedQuestions')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.suggested_questions.map((q, i) => (
            <button
              key={i}
              onClick={() => { localStorage.setItem("nyay_pending_question", q); onGoToChat() }}
              className="text-xs bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1.5 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onGoToChat}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {lang === 'hi' ? 'AI से और पूछें' : 'Ask AI More'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()
  const { t, lang } = useLanguage()

  const handleGoToChat = () => router.push("/chat")

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    for (const file of fileArray) {
      const fileId = Math.random().toString(36).substr(2, 9)
      setUploadedFiles((prev) => [...prev, { file, id: fileId, progress: 0, status: "uploading" }])

      const progressInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => f.id === fileId && f.status === "uploading"
            ? { ...f, progress: Math.min(f.progress + 12, 80) } : f)
        )
      }, 400)

      const formData = new FormData()
      formData.append("file", file)

      try {
        setUploadedFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: "processing", progress: 85 } : f))
        const response = await fetch(apiUrl("/upload/"), { method: "POST", body: formData })
        clearInterval(progressInterval)

        if (response.ok) {
          const data = await response.json()
          const analysis = data.analysis as DocumentAnalysis
          const verification = data.verification as VerificationReport | undefined
          if (analysis) {
            const now = new Date().toISOString()
            localStorage.setItem("nyay_document_analysis", JSON.stringify(analysis))
            localStorage.setItem("nyay_document_name", file.name)
            localStorage.setItem("nyay_upload_time", now)
            // Save to documents array for compare feature (max 5, localStorage cache)
            try {
              const existing = JSON.parse(localStorage.getItem("nyay_documents") ?? "[]")
              const updated = [{ id: fileId, name: file.name, analysis, uploadedAt: now }, ...existing].slice(0, 5)
              localStorage.setItem("nyay_documents", JSON.stringify(updated))
            } catch {}
            // Persist to Supabase (non-blocking — fails silently if not logged in)
            saveDocument({ name: file.name, analysis, verification })
          }
          if (verification) localStorage.setItem("nyay_document_verification", JSON.stringify(verification))
          setUploadedFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: "complete", progress: 100, analysis, verification } : f))
        } else {
          clearInterval(progressInterval)
          setUploadedFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: "error" } : f))
        }
      } catch {
        clearInterval(progressInterval)
        setUploadedFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: "error" } : f))
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {lang === 'hi' ? 'दस्तावेज़ AI विश्लेषण' : 'Document AI Analysis'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {lang === 'hi' ? 'अपना कानूनी दस्तावेज़ अपलोड करें — AI तुरंत विश्लेषण करेगा' : 'Upload your legal document — AI will analyze it instantly'}
          </p>
        </div>

        <Card
          className={`border-2 border-dashed transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg ${
            isDragOver ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105" : "border-gray-200 dark:border-gray-600 hover:border-green-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="text-center py-12 space-y-5">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Upload className={`w-10 h-10 text-white transition-transform ${isDragOver ? "scale-110" : ""}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                {lang === 'hi' ? 'अपना दस्तावेज़ यहाँ खींचें' : 'Drop your document here'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">PDF, DOCX, TXT — {lang === 'hi' ? 'अधिकतम 10MB' : 'Max 10MB'}</p>
            </div>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                multiple
                onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileUpload(e.target.files)}
              />
              <label htmlFor="file-upload">
                <Button
                  size="lg"
                  className="cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl px-8"
                  asChild
                >
                  <span>
                    <FileText className="w-5 h-5 mr-2" />
                    {lang === 'hi' ? 'फाइल चुनें' : 'Choose File'}
                  </span>
                </Button>
              </label>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
              {(lang === 'hi'
                ? ['100% सुरक्षित', 'हिंदी + अंग्रेजी', 'तुरंत परिणाम']
                : ['100% Secure', 'Hindi + English', 'Instant Results']
              ).map((item) => (
                <div key={item} className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            {uploadedFiles.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white truncate max-w-xs">{uploadedFile.file.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedFiles((p) => p.filter((f) => f.id !== uploadedFile.id))} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {(uploadedFile.status === "uploading" || uploadedFile.status === "processing") && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          {uploadedFile.status === "uploading"
                            ? (lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...')
                            : (lang === 'hi' ? 'AI विश्लेषण हो रहा है...' : 'AI analyzing...')}
                        </span>
                        <span>{uploadedFile.progress}%</span>
                      </div>
                      <Progress value={uploadedFile.progress} className="h-2" />
                    </div>
                  )}

                  {uploadedFile.status === "complete" && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">
                          {lang === 'hi' ? 'सफलतापूर्वक विश्लेषण पूर्ण' : 'Analysis complete'}
                        </span>
                      </div>
                      {uploadedFile.analysis && (
                        <AnalysisSummary
                          analysis={uploadedFile.analysis}
                          verification={uploadedFile.verification}
                          fileName={uploadedFile.file.name}
                          onGoToChat={handleGoToChat}
                        />
                      )}
                    </div>
                  )}

                  {uploadedFile.status === "error" && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'अपलोड में त्रुटि हुई। पुनः प्रयास करें।' : 'Upload failed. Please try again.'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
