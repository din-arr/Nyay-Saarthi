"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Search, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { DocumentHistory } from "./document-history"
import { useLanguage } from "@/lib/language-context"

export function DashboardUI({ displayName }: { displayName: string }) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('welcomePrefix')} {displayName}!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('yourDocs')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('searchDocs')}
                  className="pl-10 w-56 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('newUpload')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <DocumentHistory />
      </div>
    </div>
  )
}
