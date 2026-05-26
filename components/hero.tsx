"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, Shield, Sparkles, Users, Award, Brain, Zap } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

function useCountUp(target: number, duration = 2000, startOnVisible = true) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnVisible) {
      setStarted(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, ref }
}

function StatCounter({
  target,
  suffix,
  label,
  icon: Icon,
  color,
}: {
  target: number
  suffix: string
  label: string
  icon: React.ElementType
  color: string
}) {
  const { count, ref } = useCountUp(target)
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {count.toLocaleString("en-IN")}
          {suffix}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

export function Hero() {
  const { t, lang } = useLanguage()
  const [dragActive, setDragActive] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Background blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float animate-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-100/20 to-emerald-100/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className={`space-y-8 ${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-6 py-3 rounded-full text-sm font-semibold shadow-lg animate-scale-in">
              <Shield className="w-5 h-5" />
              <span>{t('heroTag')}</span>
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight animate-fade-in-up animate-delay-100">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {t('heroTitle1')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed animate-fade-in-up animate-delay-200">
              {t('heroDesc')}
            </p>

            {/* AI Feature Pills */}
            <div className="flex flex-wrap gap-2 animate-fade-in-up animate-delay-200">
              {[
                { icon: Brain, label: lang === 'hi' ? 'AI जोखिम विश्लेषण' : 'AI Risk Analysis' },
                { icon: Zap, label: lang === 'hi' ? 'तुरंत सारांश' : 'Instant Summary' },
                { icon: Shield, label: lang === 'hi' ? 'दस्तावेज़ सत्यापन' : 'Document Verification' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
              <Link href="/upload">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold border-0"
                >
                  <Upload className="w-6 h-6 mr-3" />
                  {t('uploadDoc')}
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-2 border-green-700 text-green-800 dark:text-green-400 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-transparent font-semibold"
                >
                  <FileText className="w-6 h-6 mr-3" />
                  {t('tryDemo')}
                </Button>
              </Link>
            </div>

            {/* Animated Trust Stats */}
            <div className="flex flex-wrap items-center gap-8 pt-4 animate-fade-in-up animate-delay-400">
              <StatCounter
                target={50000}
                suffix="+"
                label={t('stat1')}
                icon={Users}
                color="bg-gradient-to-br from-green-500 to-emerald-500"
              />
              <StatCounter
                target={99}
                suffix=".9%"
                label={t('stat2')}
                icon={Award}
                color="bg-gradient-to-br from-emerald-500 to-green-500"
              />
              <StatCounter
                target={10000}
                suffix="+"
                label={t('stat3')}
                icon={FileText}
                color="bg-gradient-to-br from-blue-500 to-indigo-500"
              />
            </div>
          </div>

          {/* Right — Upload Card */}
          <div className={`${isVisible ? "animate-slide-in-right animate-delay-200" : "opacity-0"}`}>
            <Card className="p-8 border-2 border-dashed border-green-200 dark:border-green-700 hover:border-green-400 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl hover:shadow-3xl transform hover:scale-105">
              <div
                className={`text-center py-12 rounded-2xl transition-all duration-300 ${
                  dragActive ? "bg-green-50 border-2 border-green-300" : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-float">
                  <Upload className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                  {lang === 'hi' ? 'अपना दस्तावेज़ यहाँ खींचें' : 'Drop Your Document Here'}
                </h3>

                <p className="text-gray-500 dark:text-gray-400 mb-2 text-base">
                  {lang === 'hi' ? 'PDF, DOCX, या टेक्स्ट फाइल अपलोड करें' : 'Upload PDF, DOCX, or text files'}
                </p>
                <p className="text-sm text-green-600 font-medium mb-8">
                  {lang === 'hi' ? '(अधिकतम 10MB)' : '(Max 10MB)'}
                </p>

                {/* Mini feature list */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6 text-left space-y-2">
                  {(lang === 'hi'
                    ? ['AI जोखिम स्कोर तुरंत मिलता है', 'पक्षकार और तारीखें auto-detect', '5 स्मार्ट प्रश्न सुझाए जाते हैं']
                    : ['Instant AI risk score', 'Auto-detect parties & dates', '5 smart questions suggested']
                  ).map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Link href="/upload">
                  <Button
                    size="lg"
                    className="mb-6 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {lang === 'hi' ? 'फाइल चुनें' : 'Choose File'}
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                  {(lang === 'hi'
                    ? ['100% सुरक्षित', 'पूर्ण निजता', 'तुरंत परिणाम']
                    : ['100% Secure', 'Full Privacy', 'Instant Results']
                  ).map((item) => (
                    <div key={item} className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
