"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Scale, Send, Bot, User, Copy, CheckCheck, Loader2, Lightbulb, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { apiUrl } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface Message { id: number; content: string; sender: "user" | "ai"; timestamp: Date }

const SAMPLE_QUESTIONS_HI = [
  "धारा 144 क्या है?",
  "दिल्ली में किरायेदार के क्या अधिकार हैं?",
  "उपभोक्ता संरक्षण अधिनियम 2019 क्या है?",
  "FIR कैसे दर्ज करें?",
  "संपत्ति हस्तांतरण अधिनियम की मुख्य धाराएं?",
  "RTI कैसे दायर करें?",
]
const SAMPLE_QUESTIONS_EN = [
  "What is Section 144 IPC?",
  "What are tenant rights in Delhi?",
  "What is Consumer Protection Act 2019?",
  "How to file an FIR in India?",
  "Key sections of Transfer of Property Act?",
  "How to file RTI in India?",
]

const HISTORY_KEY = "nyay_legal_qa_history"

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-•]\s/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      )
    }
    return <p key={i} className="my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
  })
}

export default function LegalQAPage() {
  const { lang } = useLanguage()
  const hi = lang === "hi"
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setMessages(JSON.parse(raw).map((m: Message & { timestamp: string }) => ({ ...m, timestamp: new Date(m.timestamp) })))
    } catch {}
  }, [])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(HISTORY_KEY, JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (question?: string) => {
    const text = question ?? input.trim()
    if (!text) return
    const userMsg: Message = { id: Date.now(), content: text, sender: "user", timestamp: new Date() }
    const aiId = Date.now() + 1
    setMessages(prev => [...prev, userMsg, { id: aiId, content: "", sender: "ai", timestamp: new Date() }])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(apiUrl("/general-ask-stream/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: lang }),
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
            if (parsed.content) {
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + parsed.content } : m))
            } else if (parsed.error) {
              setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: parsed.error } : m))
            }
          } catch {}
        }
      }
    } catch {
      setLoading(false)
      setMessages(prev => prev.map(m => m.id === aiId
        ? { ...m, content: hi ? "त्रुटि हुई। कृपया पुनः प्रयास करें।" : "Error occurred. Please try again." }
        : m))
    }
  }

  const copyMsg = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const samples = hi ? SAMPLE_QUESTIONS_HI : SAMPLE_QUESTIONS_EN

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-80px)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {hi ? "कानूनी प्रश्नोत्तर" : "Legal Q&A"}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hi ? "बिना दस्तावेज़ के भारतीय कानून के बारे में पूछें" : "Ask about Indian law — no document needed"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-0 text-xs">
              <Bot className="w-3 h-3 mr-1" />{hi ? "Ollama" : "Ollama AI"}
            </Badge>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setMessages([]); localStorage.removeItem(HISTORY_KEY) }}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sample questions */}
        {messages.length === 0 && (
          <Card className="mb-4 bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700 shadow-sm shrink-0">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                {hi ? "इन प्रश्नों से शुरू करें:" : "Start with these questions:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {samples.map((q, i) => (
                  <button key={i} onClick={() => send(q)}
                    className="text-xs bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1.5 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-start gap-3 max-w-2xl group ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={msg.sender === "user"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                    : "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"}>
                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className={`rounded-2xl px-4 py-3 ${msg.sender === "user"
                    ? "bg-purple-600 text-white rounded-tr-sm"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200"}`}>
                    {msg.sender === "ai"
                      ? <div className="text-sm space-y-0.5">{renderMarkdown(msg.content)}</div>
                      : <p className="text-sm">{msg.content}</p>}
                  </div>
                  <div className={`flex items-center gap-2 px-1 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    {msg.sender === "ai" && (
                      <button onClick={() => copyMsg(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        {copied === msg.id ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900/50 text-purple-600">
                    <Scale className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <div className="flex gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={hi ? "भारतीय कानून के बारे में कोई भी प्रश्न पूछें..." : "Ask any question about Indian law..."}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none px-2"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
            {hi ? "यह AI सामान्य जानकारी देता है, कानूनी सलाह नहीं। महत्वपूर्ण मामलों में वकील से मिलें।"
              : "This AI provides general information, not legal advice. Consult a lawyer for important matters."}
          </p>
        </div>
      </div>
    </div>
  )
}
