'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'hi' | 'en'

export const translations = {
  hi: {
    // Nav
    dashboard: 'डैशबोर्ड',
    aiChat: 'AI चैट',
    consultation: 'परामर्श',
    support: 'सहायता',
    login: 'लॉग इन करें',
    getStarted: 'अभी शुरू करें',
    logout: 'लॉग आउट',
    // Hero
    heroTag: 'AI-Powered Legal Assistant',
    heroTitle1: 'कानूनी दस्तावेज़',
    heroTitle2: 'समझना अब आसान',
    heroDesc: 'जटिल कानूनी दस्तावेज़ों को सरल हिंदी में समझें। AI विश्लेषण, जोखिम मूल्यांकन और स्मार्ट प्रश्नोत्तर — सब एक जगह।',
    uploadDoc: 'दस्तावेज़ अपलोड करें',
    tryDemo: 'AI चैट देखें',
    stat1: 'उपयोगकर्ता',
    stat2: 'सटीकता',
    stat3: 'दस्तावेज़ विश्लेषित',
    // Upload
    uploadTitle: 'दस्तावेज़ अपलोड करें',
    uploadDesc: 'PDF, DOCX, या TXT फ़ाइल अपलोड करें',
    analyzing: 'विश्लेषण हो रहा है...',
    uploadSuccess: 'अपलोड सफल!',
    dragDrop: 'यहाँ फ़ाइल खींचें या क्लिक करें',
    // Chat
    chatPlaceholder: 'दस्तावेज़ के बारे में कुछ पूछें...',
    send: 'भेजें',
    noDoc: 'कोई दस्तावेज़ नहीं',
    uploadFirst: 'पहले कोई दस्तावेज़ अपलोड करें',
    // Dashboard
    welcomePrefix: 'नमस्ते,',
    yourDocs: 'आपके दस्तावेज़ों का AI विश्लेषण',
    newUpload: 'नया अपलोड',
    searchDocs: 'दस्तावेज़ खोजें...',
    // Common
    riskHigh: 'उच्च जोखिम',
    riskMedium: 'मध्यम जोखिम',
    riskLow: 'कम जोखिम',
    parties: 'पक्षकार',
    keyDates: 'मुख्य तिथियाँ',
    clauses: 'मुख्य धाराएँ',
    riskFactors: 'जोखिम कारक',
    suggestedQuestions: 'सुझाए गए प्रश्न',
    // New features
    compare: 'तुलना',
    templates: 'टेम्पलेट',
    timeline: 'समयरेखा',
    downloadReport: 'रिपोर्ट डाउनलोड',
    generateDoc: 'दस्तावेज़ बनाएं',
    selectTemplate: 'टेम्पलेट चुनें',
  },
  en: {
    // Nav
    dashboard: 'Dashboard',
    aiChat: 'AI Chat',
    consultation: 'Consultation',
    support: 'Support',
    login: 'Log In',
    getStarted: 'Get Started',
    logout: 'Log Out',
    // Hero
    heroTag: 'AI-Powered Legal Assistant',
    heroTitle1: 'Legal Documents',
    heroTitle2: 'Made Simple',
    heroDesc: 'Understand complex legal documents in plain language. AI analysis, risk assessment and smart Q&A — all in one place.',
    uploadDoc: 'Upload Document',
    tryDemo: 'Try AI Chat',
    stat1: 'Users',
    stat2: 'Accuracy',
    stat3: 'Documents Analyzed',
    // Upload
    uploadTitle: 'Upload Document',
    uploadDesc: 'Upload a PDF, DOCX, or TXT file',
    analyzing: 'Analyzing...',
    uploadSuccess: 'Upload Successful!',
    dragDrop: 'Drag & drop a file here or click to browse',
    // Chat
    chatPlaceholder: 'Ask something about the document...',
    send: 'Send',
    noDoc: 'No Document',
    uploadFirst: 'Please upload a document first',
    // Dashboard
    welcomePrefix: 'Hello,',
    yourDocs: 'AI Analysis of Your Documents',
    newUpload: 'New Upload',
    searchDocs: 'Search documents...',
    // Common
    riskHigh: 'High Risk',
    riskMedium: 'Medium Risk',
    riskLow: 'Low Risk',
    parties: 'Parties',
    keyDates: 'Key Dates',
    clauses: 'Key Clauses',
    riskFactors: 'Risk Factors',
    suggestedQuestions: 'Suggested Questions',
    // New features
    compare: 'Compare',
    templates: 'Templates',
    timeline: 'Timeline',
    downloadReport: 'Download Report',
    generateDoc: 'Generate Document',
    selectTemplate: 'Select Template',
  },
} as const

export type TranslationKey = keyof typeof translations.hi

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'hi',
  setLang: () => {},
  t: (key) => translations.hi[key],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('hi')

  useEffect(() => {
    const saved = localStorage.getItem('nyay_lang') as Lang | null
    if (saved === 'hi' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('nyay_lang', l)
  }

  const t = (key: TranslationKey): string => translations[lang][key]
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
