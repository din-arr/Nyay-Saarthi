"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/actions"
import { useLanguage } from "@/lib/language-context"
import {
  UserCircle, Mail, FileText, TrendingUp, LogOut,
  Shield, Calendar, LayoutDashboard, Upload,
} from "lucide-react"
import Link from "next/link"

interface LocalUser {
  name?: string
  email?: string
}

interface DocumentAnalysis {
  document_type: string
  risk_score: number
  risk_level: string
  parties: string[]
}

export default function ProfilePage() {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [user, setUser] = useState<LocalUser | null>(null)
  const [docAnalysis, setDocAnalysis] = useState<DocumentAnalysis | null>(null)
  const [docName, setDocName] = useState<string>("")
  const [uploadTime, setUploadTime] = useState<string>("")

  useEffect(() => {
    // Read local user from localStorage
    try {
      const raw = localStorage.getItem("nyay_local_user")
      if (raw) setUser(JSON.parse(raw))
    } catch {}

    // Read last document
    try {
      const analysis = localStorage.getItem("nyay_document_analysis")
      const name = localStorage.getItem("nyay_document_name")
      const time = localStorage.getItem("nyay_upload_time")
      if (analysis) setDocAnalysis(JSON.parse(analysis))
      if (name) setDocName(name)
      if (time) setUploadTime(time)
    } catch {}
  }, [])

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? (lang === "hi" ? "उपयोगकर्ता" : "User")
  const displayEmail = user?.email ?? "—"

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    })

  const riskColor =
    docAnalysis?.risk_level === "Low"
      ? "text-green-600 dark:text-green-400"
      : docAnalysis?.risk_level === "High"
      ? "text-red-600 dark:text-red-400"
      : "text-orange-500 dark:text-orange-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Profile Card */}
        <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{displayName}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate">{displayEmail}</span>
                </div>
                <Badge className="mt-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                  <Shield className="w-3 h-3 mr-1" />
                  {lang === "hi" ? "सक्रिय खाता" : "Active Account"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{docName ? "1" : "0"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === "hi" ? "दस्तावेज़ विश्लेषित" : "Documents Analyzed"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${riskColor}`}>
                  {docAnalysis?.risk_score ?? "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === "hi" ? "जोखिम स्कोर" : "Risk Score"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Document */}
        {docName && docAnalysis && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                {lang === "hi" ? "अंतिम दस्तावेज़" : "Last Document"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">{docName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {uploadTime ? formatDate(uploadTime) : "—"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300 shrink-0">
                  {docAnalysis.document_type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${docAnalysis.risk_level === "Low" ? "bg-green-500" : docAnalysis.risk_level === "High" ? "bg-red-500" : "bg-orange-500"}`}
                    style={{ width: `${docAnalysis.risk_score}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${riskColor}`}>{docAnalysis.risk_score}/100</span>
              </div>
              <Link href="/chat">
                <Button size="sm" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white mt-1">
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  {lang === "hi" ? "AI से पूछें" : "Ask AI"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/dashboard">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-800 dark:text-white text-sm">{t("dashboard")}</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/upload">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-800 dark:text-white text-sm">{t("newUpload")}</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Logout */}
        <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
          <CardContent className="p-4">
            <form action={signOut}>
              <Button type="submit" variant="destructive" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                {t("logout")}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
