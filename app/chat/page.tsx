"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Send, Bot, User, FileText, AlertTriangle, Lightbulb,
  Copy, CheckCheck, Shield, Calendar, Users, ChevronDown, ChevronUp, Trash2, SwitchCamera,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { getDocuments, isSupabaseUser } from "@/lib/supabase-documents"

interface Message {
  id: number
  content: string
  sender: "user" | "ai"
  timestamp: Date
  sources?: { content: string; page: number }[]
}

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

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  lines.forEach((line, i) => {
    if (line.trim() === "") { elements.push(<div key={i} className="h-2" />); return }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s/, "")
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        </div>
      )
      return
    }
    elements.push(<p key={i} className="my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />)
  })
  return <div className="text-sm space-y-0.5">{elements}</div>
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">$1</code>')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      title="Copy"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function RiskBadge({ level, score }: { level: string; score: number }) {
  const style = level === "Low"
    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700"
    : level === "High"
    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
    : "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700"
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      <Shield className="w-3 h-3" />
      {level} Risk ({score}/100)
    </span>
  )
}

const WELCOME_MSG: Message = {
  id: 1,
  content: "नमस्ते! / Hello! I'm your AI legal assistant. Upload a document and ask any question in Hindi or English — I'll answer in simple language.",
  sender: "ai",
  timestamp: new Date(),
}

function getChatKey(docName: string) {
  return `nyay_chat_${docName.replace(/[^a-zA-Z0-9]/g, "_")}`
}

interface StoredDoc { id: string; name: string; analysis: DocumentAnalysis; uploadedAt: string }

export default function ChatPage() {
  const { t, lang } = useLanguage()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [documentName, setDocumentName] = useState<string>("")
  const [showSources, setShowSources] = useState<Record<number, boolean>>({})
  const [allDocs, setAllDocs] = useState<StoredDoc[]>([])
  const [showDocPicker, setShowDocPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    async function init() {
      // Load all docs for the picker
      let docs: StoredDoc[] = []
      const sbUser = await isSupabaseUser()
      const sbDocs = await getDocuments()
      if (sbDocs.length > 0) {
        docs = sbDocs.map((d) => ({ id: d.id, name: d.name, analysis: d.analysis, uploadedAt: d.uploaded_at }))
      } else {
        try {
          const raw = localStorage.getItem("nyay_documents")
          if (raw) docs = JSON.parse(raw)
        } catch {}
      }
      setAllDocs(docs)

      const stored = localStorage.getItem("nyay_document_analysis")
      const name = localStorage.getItem("nyay_document_name")
      if (stored) { try { setAnalysis(JSON.parse(stored)) } catch {} }

      const docName = name ?? ""
      setDocumentName(docName)

      if (docName) {
        const raw = localStorage.getItem(getChatKey(docName))
        if (raw) {
          try {
            const parsed: Message[] = JSON.parse(raw).map((m: Message & { timestamp: string }) => ({
              ...m, timestamp: new Date(m.timestamp),
            }))
            setMessages(parsed.length ? parsed : [WELCOME_MSG])
          } catch { setMessages([WELCOME_MSG]) }
        } else { setMessages([WELCOME_MSG]) }
      } else { setMessages([WELCOME_MSG]) }

      loadedRef.current = true
      const pending = localStorage.getItem("nyay_pending_question")
      if (pending) { setInputMessage(pending); localStorage.removeItem("nyay_pending_question") }
    }
    init()
  }, [])

  const switchDocument = (doc: StoredDoc) => {
    localStorage.setItem("nyay_document_analysis", JSON.stringify(doc.analysis))
    localStorage.setItem("nyay_document_name", doc.name)
    setAnalysis(doc.analysis)
    setDocumentName(doc.name)
    setShowDocPicker(false)
    const raw = localStorage.getItem(getChatKey(doc.name))
    if (raw) {
      try {
        const parsed: Message[] = JSON.parse(raw).map((m: Message & { timestamp: string }) => ({ ...m, timestamp: new Date(m.timestamp) }))
        setMessages(parsed.length ? parsed : [WELCOME_MSG])
      } catch { setMessages([WELCOME_MSG]) }
    } else { setMessages([WELCOME_MSG]) }
  }

  // Persist chat history to localStorage on every change, keyed by document name
  useEffect(() => {
    if (!loadedRef.current || !documentName || messages.length === 0) return
    localStorage.setItem(getChatKey(documentName), JSON.stringify(messages))
  }, [messages, documentName])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const clearChat = () => {
    const fresh = { ...WELCOME_MSG, timestamp: new Date() }
    setMessages([fresh])
    if (documentName) localStorage.removeItem(getChatKey(documentName))
  }

  const handleSendMessage = async (questionOverride?: string) => {
    const text = questionOverride ?? inputMessage
    if (!text.trim()) return

    const userMessage: Message = { id: messages.length + 1, content: text, sender: "user", timestamp: new Date() }
    const aiId = messages.length + 2
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Add empty AI message immediately so user sees it start filling
    setMessages((prev) => [...prev, { id: aiId, content: "", sender: "ai", timestamp: new Date(), sources: [] }])

    try {
      const response = await fetch(apiUrl("/ask-stream/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: lang }),
      })
      if (!response.body) throw new Error("No stream")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      setIsTyping(false)

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
            if (parsed.sources) {
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, sources: parsed.sources } : m))
            } else if (parsed.content) {
              setMessages((prev) => prev.map((m) =>
                m.id === aiId ? { ...m, content: m.content + parsed.content } : m
              ))
            } else if (parsed.error) {
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: parsed.error } : m))
            }
          } catch {}
        }
      }
    } catch {
      setIsTyping(false)
      setMessages((prev) => prev.map((m) =>
        m.id === aiId
          ? { ...m, content: lang === 'hi' ? "त्रुटि हुई। कृपया पुनः प्रयास करें।" : "An error occurred. Please try again." }
          : m
      ))
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(lang === 'hi' ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })

  const defaultQuestions = lang === 'hi'
    ? ["मुख्य जोखिम क्या है?", "समय सीमा कब तक है?", "भुगतान की शर्तें क्या हैं?", "अनुबंध तोड़ने पर क्या होगा?"]
    : ["What are the main risks?", "What is the deadline?", "What are the payment terms?", "What happens if contract is broken?"]

  const questions = analysis?.suggested_questions?.length ? analysis.suggested_questions : defaultQuestions

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="flex h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {lang === 'hi' ? 'AI कानूनी सहायक' : 'AI Legal Assistant'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {documentName ? `📄 ${documentName}` : (lang === 'hi' ? 'दस्तावेज़ अपलोड करें और प्रश्न पूछें' : 'Upload a document and ask questions')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {analysis && <RiskBadge level={analysis.risk_level} score={analysis.risk_score} />}
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                  <Bot className="h-3 w-3 mr-1" />{lang === 'hi' ? 'ऑनलाइन' : 'Online'}
                </Badge>
                {allDocs.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setShowDocPicker((v) => !v)}
                    className="border-blue-400 text-blue-600 dark:border-blue-700 dark:text-blue-400 text-xs gap-1">
                    <SwitchCamera className="h-3.5 w-3.5" />
                    {lang === 'hi' ? 'बदलें' : 'Switch'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearChat}
                  title={lang === 'hi' ? 'चैट साफ़ करें' : 'Clear chat'}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document picker dropdown */}
            {showDocPicker && (
              <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 space-y-2 max-h-52 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  {lang === 'hi' ? 'किस दस्तावेज़ से बात करें?' : 'Which document to chat with?'}
                </p>
                {allDocs.map((doc) => (
                  <button key={doc.id} onClick={() => switchDocument(doc)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                      doc.name === documentName
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 dark:hover:border-green-700"
                    }`}>
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{doc.analysis.document_type} · Risk {doc.analysis.risk_score}/100</p>
                    </div>
                    {doc.name === documentName && <CheckCheck className="w-4 h-4 text-green-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-3 max-w-2xl group ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={message.sender === "user" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" : "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"}>
                      {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200"
                    }`}>
                      {message.sender === "ai" ? renderMarkdown(message.content) : <p className="text-sm">{message.content}</p>}
                    </div>

                    <div className={`flex items-center gap-2 px-1 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(message.timestamp)}</span>
                      {message.sender === "ai" && <CopyButton text={message.content} />}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-1">
                        <button
                          onClick={() => setShowSources((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
                          className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 font-medium"
                        >
                          {showSources[message.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {showSources[message.id]
                            ? (lang === 'hi' ? 'स्रोत छुपाएं' : 'Hide sources')
                            : `${message.sources.length} ${lang === 'hi' ? 'स्रोत देखें' : 'sources'}`}
                        </button>
                        {showSources[message.id] && (
                          <div className="mt-2 space-y-1">
                            {message.sources.map((source, idx) => (
                              <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {lang === 'hi' ? `पृष्ठ ${source.page}:` : `Page ${source.page}:`}
                                </span>{" "}
                                {source.content.slice(0, 120)}…
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Smart Questions Bar */}
          {messages.length <= 2 && (
            <div className="px-6 pb-3 shrink-0">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {analysis ? (lang === 'hi' ? 'AI सुझाए गए प्रश्न:' : 'AI suggested questions:') : (lang === 'hi' ? 'सामान्य प्रश्न:' : 'Common questions:')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {questions.slice(0, 4).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="text-xs bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1.5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <Input
                placeholder={t('chatPlaceholder')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 focus:border-green-400"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 shadow-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto hidden lg:block shrink-0">
          <div className="space-y-4">
            <Card className="border-green-100 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-300">
                  <FileText className="h-4 w-4" />
                  {lang === 'hi' ? 'दस्तावेज़ जानकारी' : 'Document Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {analysis ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'hi' ? 'प्रकार' : 'Type'}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{analysis.document_type}</p>
                    </div>
                    <RiskBadge level={analysis.risk_level} score={analysis.risk_score} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang === 'hi' ? 'दस्तावेज़ अपलोड करें और यहाँ जानकारी देखें।' : 'Upload a document to see info here.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {analysis?.parties && analysis.parties.length > 0 && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 dark:text-white">
                    <Users className="h-4 w-4 text-blue-500" />
                    {t('parties')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  {analysis.parties.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{p}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis?.key_dates && analysis.key_dates.length > 0 && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 dark:text-white">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    {t('keyDates')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  {analysis.key_dates.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{d}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis?.risk_factors && analysis.risk_factors.length > 0 && (
              <Card className="border-red-100 dark:border-red-900 dark:bg-gray-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    {t('riskFactors')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  {analysis.risk_factors.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{r}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis && (
              <Card className="border-yellow-100 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Lightbulb className="h-4 w-4" />
                    {t('suggestedQuestions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {analysis.suggested_questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left text-xs bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
