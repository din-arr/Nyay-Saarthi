"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Languages, Loader2, Copy, CheckCheck, ArrowRight, Download } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

const LANGUAGES = [
  { key: "hindi", label: "हिंदी", flag: "🇮🇳" },
  { key: "english", label: "English", flag: "🇬🇧" },
  { key: "bengali", label: "বাংলা", flag: "🟡" },
  { key: "tamil", label: "தமிழ்", flag: "🟠" },
  { key: "marathi", label: "मराठी", flag: "🟣" },
  { key: "gujarati", label: "ગુજરાતી", flag: "🔵" },
  { key: "punjabi", label: "ਪੰਜਾਬੀ", flag: "🟤" },
]

export default function TranslatePage() {
  const { lang } = useLanguage()
  const hi = lang === "hi"

  const [sourceText, setSourceText] = useState("")
  const [targetLang, setTargetLang] = useState("english")
  const [translated, setTranslated] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    setLoading(true)
    setTranslated("")
    try {
      const res = await fetch(apiUrl("/translate-stream/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, target_language: targetLang, language: lang }),
      })
      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) setTranslated(prev => prev + parsed.content)
            else if (parsed.error) setTranslated(hi ? "अनुवाद में त्रुटि।" : "Translation error.")
          } catch {}
        }
      }
    } catch {
      setLoading(false)
      setTranslated(hi ? "सर्वर से जुड़ने में त्रुटि।" : "Could not connect to server.")
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(translated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([translated], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `translated_${targetLang}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const targetLabel = LANGUAGES.find(l => l.key === targetLang)?.label ?? targetLang

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hi ? "बहुभाषी कानूनी अनुवाद" : "Legal Document Translator"}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hi ? "कानूनी दस्तावेज़ को भारतीय भाषाओं में अनुवाद करें" : "Translate legal documents between Indian regional languages using local AI"}
          </p>
        </div>

        {/* Language selector */}
        <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-700 dark:text-gray-300">
              {hi ? "अनुवाद की भाषा चुनें" : "Select target language"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.key} onClick={() => setTargetLang(l.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    targetLang === l.key
                      ? "border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}>
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {targetLang === l.key && <Badge className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-0">{hi ? "चुना" : "Selected"}</Badge>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Translation area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Source */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700 dark:text-gray-300">
                  {hi ? "मूल पाठ" : "Source Text"}
                </CardTitle>
                <span className="text-xs text-gray-400">{charCount}/3000</span>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={sourceText}
                onChange={(e) => { setSourceText(e.target.value); setCharCount(e.target.value.length) }}
                maxLength={3000}
                rows={14}
                placeholder={hi
                  ? "यहाँ कानूनी पाठ लिखें या पेस्ट करें जिसका आप अनुवाद करना चाहते हैं..."
                  : "Paste or type the legal text you want to translate here..."}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <Button onClick={handleTranslate} disabled={loading || !sourceText.trim()}
                className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{hi ? "अनुवाद हो रहा है..." : "Translating..."}</>
                  : <><Languages className="w-4 h-4 mr-2" />{hi ? `${targetLabel} में अनुवाद करें` : `Translate to ${targetLabel}`}<ArrowRight className="w-4 h-4 ml-2" /></>
                }
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700 dark:text-gray-300">
                  {hi ? `${targetLabel} में अनुवाद` : `Translation in ${targetLabel}`}
                </CardTitle>
                {translated && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleDownload} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-56 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-gray-500">{hi ? "अनुवाद शुरू हो रहा है..." : "Starting translation..."}</p>
                  </div>
                </div>
              ) : translated ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 min-h-56 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{translated}</p>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {hi ? "अनुवाद यहाँ दिखेगा" : "Translation will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">{hi ? "सुझाव:" : "Tips:"}</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>{hi ? "पार्टी के नाम, तारीखें और राशि अपरिवर्तित रहेंगी" : "Party names, dates, and amounts are preserved as-is"}</li>
              <li>{hi ? "बड़े दस्तावेज़ों को छोटे भागों में विभाजित करें" : "For large documents, split into smaller sections (max 3000 chars)"}</li>
              <li>{hi ? "AI स्थानीय Ollama का उपयोग करता है — कोई क्लाउड नहीं" : "AI uses local Ollama — no data leaves your device"}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
