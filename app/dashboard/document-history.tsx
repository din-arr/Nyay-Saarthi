"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText, AlertTriangle, Upload, MessageSquare,
  Shield, TrendingUp, Clock, CheckCircle, XCircle,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

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

interface StoredDocument {
  name: string
  analysis: DocumentAnalysis
  uploadedAt: string
}

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
    return (
      <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 border text-xs">
        <Shield className="w-3 h-3 mr-1" /> Low
      </Badge>
    )
  if (level === "High")
    return (
      <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 border text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" /> High
      </Badge>
    )
  return (
    <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700 border text-xs">
      <Shield className="w-3 h-3 mr-1" /> Medium
    </Badge>
  )
}

export function DocumentHistory() {
  const [doc, setDoc] = useState<StoredDocument | null>(null)
  const router = useRouter()
  const { t, lang } = useLanguage()

  useEffect(() => {
    const analysis = localStorage.getItem("nyay_document_analysis")
    const name = localStorage.getItem("nyay_document_name")
    const time = localStorage.getItem("nyay_upload_time")
    if (analysis && name) {
      try {
        setDoc({ name, analysis: JSON.parse(analysis), uploadedAt: time ?? new Date().toISOString() })
      } catch {}
    }
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'hi' ? "hi-IN" : "en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    })

  if (!doc) {
    return (
      <div className="space-y-6">
        {/* Big upload CTA */}
        <div
          onClick={() => router.push("/upload")}
          className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-green-200 dark:border-green-800 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {lang === 'hi' ? 'अभी तक कोई दस्तावेज़ नहीं' : 'No documents yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 max-w-sm">
            {lang === 'hi'
              ? 'अपना पहला दस्तावेज़ (PDF, DOCX, TXT) अपलोड करें — AI तुरंत जोखिम स्कोर, पक्षकार और मुख्य धाराएं दिखाएगा।'
              : 'Upload your first document (PDF, DOCX, TXT) — AI will instantly show risk score, parties and key clauses.'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            {lang === 'hi' ? '(इतिहास इस ब्राउज़र में सहेजा जाता है)' : '(History is saved in this browser)'}
          </p>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 shadow-lg">
            <Upload className="w-4 h-4 mr-2" />
            {t('uploadDoc')}
          </Button>
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", label: lang === 'hi' ? 'AI जोखिम स्कोर' : 'AI Risk Score', desc: lang === 'hi' ? 'हर दस्तावेज़ के लिए 0-100 जोखिम मूल्यांकन' : '0-100 risk assessment for every document' },
            { icon: Shield, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", label: lang === 'hi' ? 'चैट इतिहास' : 'Chat History', desc: lang === 'hi' ? 'प्रत्येक दस्तावेज़ की अलग बातचीत सहेजी जाती है' : 'Separate conversation saved per document' },
            { icon: Clock, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", label: lang === 'hi' ? 'मुख्य तारीखें' : 'Key Dates', desc: lang === 'hi' ? 'सभी महत्वपूर्ण समय-सीमाएं auto-detect' : 'All important deadlines auto-detected' },
          ].map((f) => (
            <div key={f.label} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
              <div className={`w-9 h-9 ${f.bg} rounded-lg flex items-center justify-center shrink-0`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
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

  const { analysis } = doc

  const statCards = [
    { icon: FileText, bg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400", value: "1", label: lang === 'hi' ? 'दस्तावेज़' : 'Documents' },
    { icon: TrendingUp, bg: "bg-green-100 dark:bg-green-900/40", iconColor: "text-green-600 dark:text-green-400", value: String(analysis.risk_score), label: lang === 'hi' ? 'जोखिम स्कोर' : 'Risk Score' },
    { icon: Clock, bg: "bg-purple-100 dark:bg-purple-900/40", iconColor: "text-purple-600 dark:text-purple-400", value: String(analysis.key_dates.length), label: lang === 'hi' ? 'महत्वपूर्ण तारीखें' : 'Key Dates' },
    { icon: AlertTriangle, bg: "bg-orange-100 dark:bg-orange-900/40", iconColor: "text-orange-600 dark:text-orange-400", value: String(analysis.risk_factors.length), label: lang === 'hi' ? 'जोखिम कारक' : 'Risk Factors' },
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

      {/* Document Card */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0 dark:border dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-800 dark:text-white">
              {lang === 'hi' ? 'हाल के दस्तावेज़' : 'Recent Documents'}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/upload")}
              className="text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              {t('newUpload')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(doc.uploadedAt)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                      {analysis.document_type}
                    </Badge>
                    <RiskBadge level={analysis.risk_level} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/chat")}
                  className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  {lang === 'hi' ? 'पूछें' : 'Ask'}
                </Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    {lang === 'hi' ? 'जोखिम स्कोर' : 'Risk Score'}
                  </p>
                  <RiskBar score={analysis.risk_score} level={analysis.risk_level} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    {t('parties')}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{analysis.parties.slice(0, 2).join(", ")}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  {t('clauses')}
                </p>
                <div className="space-y-1">
                  {analysis.key_clauses.slice(0, 2).map((clause, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{clause}</span>
                    </div>
                  ))}
                  {analysis.risk_factors.slice(0, 1).map((risk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/chat")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">
                {lang === 'hi' ? 'AI से पूछें' : 'Ask AI'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'hi' ? 'दस्तावेज़ के बारे में प्रश्न' : 'Questions about the document'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/upload")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">
                {lang === 'hi' ? 'नया दस्तावेज़' : 'New Document'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'hi' ? 'अपलोड और विश्लेषण करें' : 'Upload & analyze'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
