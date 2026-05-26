"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileEdit, Loader2, Download, Copy, CheckCheck,
  Building2, UserCheck, Handshake, ShieldCheck,
} from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

type TemplateKey = "rental" | "nda" | "employment" | "partnership"

interface Template {
  key: TemplateKey
  icon: React.ElementType
  color: string
  bg: string
  fields: { key: string; label_hi: string; label_en: string; placeholder_hi: string; placeholder_en: string }[]
}

const TEMPLATES: Template[] = [
  {
    key: "rental",
    icon: Building2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/40",
    fields: [
      { key: "landlord_name", label_hi: "मकान मालिक का नाम", label_en: "Landlord Name", placeholder_hi: "रमेश कुमार", placeholder_en: "Ramesh Kumar" },
      { key: "tenant_name", label_hi: "किरायेदार का नाम", label_en: "Tenant Name", placeholder_hi: "सुरेश शर्मा", placeholder_en: "Suresh Sharma" },
      { key: "property_address", label_hi: "संपत्ति का पता", label_en: "Property Address", placeholder_hi: "123, मेन रोड, दिल्ली", placeholder_en: "123, Main Road, Delhi" },
      { key: "monthly_rent", label_hi: "मासिक किराया (₹)", label_en: "Monthly Rent (₹)", placeholder_hi: "15000", placeholder_en: "15000" },
      { key: "security_deposit", label_hi: "सुरक्षा जमा (₹)", label_en: "Security Deposit (₹)", placeholder_hi: "30000", placeholder_en: "30000" },
      { key: "start_date", label_hi: "शुरुआत तारीख", label_en: "Start Date", placeholder_hi: "01 जून 2025", placeholder_en: "01 June 2025" },
      { key: "duration", label_hi: "अवधि", label_en: "Duration", placeholder_hi: "11 महीने", placeholder_en: "11 months" },
    ],
  },
  {
    key: "nda",
    icon: ShieldCheck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    fields: [
      { key: "party1_name", label_hi: "पहली पार्टी", label_en: "Party 1 Name", placeholder_hi: "ABC Technologies Pvt Ltd", placeholder_en: "ABC Technologies Pvt Ltd" },
      { key: "party2_name", label_hi: "दूसरी पार्टी", label_en: "Party 2 Name", placeholder_hi: "XYZ Solutions", placeholder_en: "XYZ Solutions" },
      { key: "purpose", label_hi: "उद्देश्य", label_en: "Purpose", placeholder_hi: "व्यापार सहयोग", placeholder_en: "Business collaboration" },
      { key: "duration", label_hi: "अवधि", label_en: "Duration", placeholder_hi: "2 वर्ष", placeholder_en: "2 years" },
      { key: "governing_law", label_hi: "शासी कानून", label_en: "Governing Law", placeholder_hi: "भारतीय कानून", placeholder_en: "Laws of India" },
    ],
  },
  {
    key: "employment",
    icon: UserCheck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    fields: [
      { key: "employer_name", label_hi: "नियोक्ता का नाम", label_en: "Employer Name", placeholder_hi: "ABC Company Pvt Ltd", placeholder_en: "ABC Company Pvt Ltd" },
      { key: "employee_name", label_hi: "कर्मचारी का नाम", label_en: "Employee Name", placeholder_hi: "अंकित वर्मा", placeholder_en: "Ankit Verma" },
      { key: "designation", label_hi: "पद", label_en: "Designation", placeholder_hi: "Software Engineer", placeholder_en: "Software Engineer" },
      { key: "monthly_salary", label_hi: "मासिक वेतन (₹)", label_en: "Monthly Salary (₹)", placeholder_hi: "50000", placeholder_en: "50000" },
      { key: "joining_date", label_hi: "ज्वाइनिंग तारीख", label_en: "Joining Date", placeholder_hi: "01 जुलाई 2025", placeholder_en: "01 July 2025" },
      { key: "probation_period", label_hi: "परिवीक्षा अवधि", label_en: "Probation Period", placeholder_hi: "3 महीने", placeholder_en: "3 months" },
    ],
  },
  {
    key: "partnership",
    icon: Handshake,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    fields: [
      { key: "partner1_name", label_hi: "पहले भागीदार का नाम", label_en: "Partner 1 Name", placeholder_hi: "राजेश गुप्ता", placeholder_en: "Rajesh Gupta" },
      { key: "partner2_name", label_hi: "दूसरे भागीदार का नाम", label_en: "Partner 2 Name", placeholder_hi: "सुनीता पटेल", placeholder_en: "Sunita Patel" },
      { key: "business_name", label_hi: "व्यवसाय का नाम", label_en: "Business Name", placeholder_hi: "गुप्ता एंड पटेल ट्रेडर्स", placeholder_en: "Gupta & Patel Traders" },
      { key: "capital_contribution", label_hi: "पूंजी योगदान", label_en: "Capital Contribution", placeholder_hi: "50-50 (₹2 लाख प्रत्येक)", placeholder_en: "50-50 (₹2 Lakh each)" },
      { key: "profit_sharing", label_hi: "लाभ वितरण", label_en: "Profit Sharing", placeholder_hi: "50% - 50%", placeholder_en: "50% - 50%" },
      { key: "start_date", label_hi: "शुरुआत तारीख", label_en: "Start Date", placeholder_hi: "01 अगस्त 2025", placeholder_en: "01 August 2025" },
    ],
  },
]

const TEMPLATE_LABELS: Record<TemplateKey, { hi: string; en: string; desc_hi: string; desc_en: string }> = {
  rental: { hi: "किराया अनुबंध", en: "Rental Agreement", desc_hi: "आवासीय/व्यावसायिक संपत्ति के लिए", desc_en: "For residential/commercial property" },
  nda: { hi: "गोपनीयता समझौता (NDA)", en: "Non-Disclosure Agreement", desc_hi: "व्यावसायिक जानकारी की सुरक्षा", desc_en: "Protect confidential business info" },
  employment: { hi: "रोजगार अनुबंध", en: "Employment Contract", desc_hi: "कर्मचारी नियुक्ति के लिए", desc_en: "For hiring employees" },
  partnership: { hi: "भागीदारी विलेख", en: "Partnership Deed", desc_hi: "साझेदारी व्यवसाय के लिए", desc_en: "For business partnerships" },
}

function InputField({
  field,
  value,
  onChange,
  lang,
}: {
  field: Template["fields"][number]
  value: string
  onChange: (v: string) => void
  lang: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
        {lang === "hi" ? field.label_hi : field.label_en}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={lang === "hi" ? field.placeholder_hi : field.placeholder_en}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

export default function TemplatesPage() {
  const { lang } = useLanguage()
  const hi = lang === "hi"
  const [selected, setSelected] = useState<TemplateKey | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState("")
  const [copied, setCopied] = useState(false)

  const template = TEMPLATES.find((t) => t.key === selected)

  const setField = (key: string, val: string) => setFields((prev) => ({ ...prev, [key]: val }))

  const handleGenerate = async () => {
    if (!template) return
    setLoading(true)
    setGenerated("")
    try {
      const res = await fetch(apiUrl("/generate/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_type: hi ? TEMPLATE_LABELS[template.key].hi : TEMPLATE_LABELS[template.key].en,
          fields,
          language: lang,
        }),
      })
      const data = await res.json()
      setGenerated(data.document ?? (hi ? "दस्तावेज़ बनाने में त्रुटि हुई।" : "Error generating document."))
    } catch {
      setGenerated(hi ? "सर्वर से जुड़ने में त्रुटि हुई।" : "Could not connect to server.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selected}_template.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "कानूनी टेम्पलेट जेनरेटर" : "Legal Template Generator"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? "AI की मदद से पेशेवर कानूनी दस्तावेज़ बनाएं" : "Generate professional legal documents with AI assistance"}
          </p>
        </div>

        {/* Template selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TEMPLATES.map((tmpl) => {
            const label = TEMPLATE_LABELS[tmpl.key]
            const Icon = tmpl.icon
            const isActive = selected === tmpl.key
            return (
              <button
                key={tmpl.key}
                onClick={() => { setSelected(tmpl.key); setGenerated(""); setFields({}) }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 ${tmpl.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${tmpl.color}`} />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight">
                  {hi ? label.hi : label.en}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {hi ? label.desc_hi : label.desc_en}
                </p>
                {isActive && (
                  <Badge className="mt-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 border text-xs">
                    {hi ? "चुना गया" : "Selected"}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Form */}
        {template && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 dark:text-white flex items-center gap-2">
                <template.icon className={`w-4 h-4 ${template.color}`} />
                {hi ? "विवरण भरें" : "Fill in the Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {template.fields.map((f) => (
                  <InputField
                    key={f.key}
                    field={f}
                    value={fields[f.key] ?? ""}
                    onChange={(v) => setField(f.key, v)}
                    lang={lang}
                  />
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {hi ? "AI दस्तावेज़ बना रहा है..." : "AI is generating..."}
                  </>
                ) : (
                  <>
                    <FileEdit className="w-4 h-4 mr-2" />
                    {hi ? "दस्तावेज़ बनाएं" : "Generate Document"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Output */}
        {generated && (
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-gray-800 dark:text-white">
                  {hi ? "तैयार दस्तावेज़" : "Generated Document"}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    {copied ? <CheckCheck className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? (hi ? "कॉपी हो गया" : "Copied!") : (hi ? "कॉपी करें" : "Copy")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Download className="w-3.5 h-3.5 mr-1" />
                    {hi ? "डाउनलोड" : "Download"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                readOnly
                value={generated}
                rows={20}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 text-sm font-mono resize-none focus:outline-none"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
