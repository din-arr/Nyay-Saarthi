'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Menu, User, LogOut, BarChart3, MessageSquare, Phone, Sun, Moon,
  UserCircle, GitCompare, FileEdit, CalendarClock, PieChart,
  Shield, Languages, Scale, Upload, ChevronLeft, ChevronRight,
  Home, HelpCircle,
} from 'lucide-react'
import { signOut } from '@/lib/actions'
import { useLanguage } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface SidebarProps {
  userEmail: string | null
  userName: string | null
}

const NAV_GROUPS = [
  {
    label: { hi: 'मुख्य', en: 'Main' },
    links: [
      { href: '/dashboard', label_hi: 'डैशबोर्ड', label_en: 'Dashboard', icon: BarChart3 },
      { href: '/upload', label_hi: 'अपलोड', label_en: 'Upload', icon: Upload },
    ],
  },
  {
    label: { hi: 'AI सुविधाएं', en: 'AI Features' },
    links: [
      { href: '/chat', label_hi: 'AI चैट', label_en: 'AI Chat', icon: MessageSquare },
      { href: '/legal-qa', label_hi: 'कानूनी Q&A', label_en: 'Legal Q&A', icon: Scale },
      { href: '/red-flags', label_hi: 'रेड-फ्लैग', label_en: 'Red Flags', icon: Shield },
      { href: '/translate', label_hi: 'अनुवाद', label_en: 'Translate', icon: Languages },
    ],
  },
  {
    label: { hi: 'दस्तावेज़', en: 'Documents' },
    links: [
      { href: '/compare', label_hi: 'तुलना', label_en: 'Compare', icon: GitCompare },
      { href: '/templates', label_hi: 'टेम्पलेट', label_en: 'Templates', icon: FileEdit },
      { href: '/analytics', label_hi: 'विश्लेषण', label_en: 'Analytics', icon: PieChart },
      { href: '/timeline', label_hi: 'समयरेखा', label_en: 'Timeline', icon: CalendarClock },
    ],
  },
  {
    label: { hi: 'अन्य', en: 'More' },
    links: [
      { href: '/consultation', label_hi: 'परामर्श', label_en: 'Consultation', icon: User },
      { href: '/support', label_hi: 'सहायता', label_en: 'Support', icon: Phone },
    ],
  },
]

function NavLinks({ collapsed, lang, pathname, onNavigate }: {
  collapsed: boolean; lang: string; pathname: string; onNavigate?: () => void
}) {
  const hi = lang === 'hi'
  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label.en}>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1">
              {hi ? group.label.hi : group.label.en}
            </p>
          )}
          <div className="space-y-0.5">
            {group.links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link key={link.href} href={link.href} onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group
                    ${isActive
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? (hi ? link.label_hi : link.label_en) : undefined}
                >
                  <link.icon className={`shrink-0 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {!collapsed && <span className="truncate">{hi ? link.label_hi : link.label_en}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const { lang, setLang } = useLanguage()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [resolvedEmail, setResolvedEmail] = useState(userEmail)
  const [resolvedName, setResolvedName] = useState(userName)
  const [mobileOpen, setMobileOpen] = useState(false)
  const hi = lang === 'hi'

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('nyay_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
    if (!userEmail) {
      try {
        const raw = localStorage.getItem('nyay_local_user')
        if (raw) {
          const u = JSON.parse(raw)
          setResolvedEmail(u.email ?? null)
          setResolvedName(u.name ?? u.email?.split('@')[0] ?? null)
        }
      } catch {}
    }
  }, [userEmail])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('nyay_sidebar_collapsed', String(next))
    window.dispatchEvent(new Event('nyay_sidebar_toggle'))
  }

  const ThemeIcon = mounted ? (theme === 'dark' ? Sun : Moon) : Moon
  const initials = resolvedName ? resolvedName[0].toUpperCase() : resolvedEmail?.[0]?.toUpperCase() ?? '?'

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Scale className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">न्याय-सारथी</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Legal Helper AI</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <NavLinks collapsed={collapsed} lang={lang} pathname={pathname} onNavigate={onNavigate} />

      {/* Bottom section */}
      <div className={`shrink-0 border-t border-gray-100 dark:border-gray-800 p-3 space-y-2`}>
        {/* Controls row */}
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center justify-between'} gap-2`}>
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="w-8 h-8 rounded-lg border border-green-400 dark:border-green-700 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center shrink-0"
            title={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          >
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        </div>

        {/* User */}
        {resolvedEmail ? (
          <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center gap-2'}`}>
            <Link href="/profile" onClick={onNavigate}
              className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              title={collapsed ? (resolvedName ?? resolvedEmail) : undefined}>
              <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 text-xs font-bold text-green-700 dark:text-green-400">
                {initials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{resolvedName ?? resolvedEmail.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{resolvedEmail}</p>
                </div>
              )}
            </Link>
            <form action={signOut}>
              <button type="submit" title={hi ? 'लॉगआउट' : 'Logout'}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          !collapsed && (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1" onClick={onNavigate}>
                <button className="w-full text-xs py-1.5 rounded-lg border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-medium">
                  {hi ? 'लॉगिन' : 'Login'}
                </button>
              </Link>
              <Link href="/register" className="flex-1" onClick={onNavigate}>
                <button className="w-full text-xs py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors font-medium">
                  {hi ? 'रजिस्टर' : 'Register'}
                </button>
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sm z-40 transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-10"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">न्याय-सारथी</span>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="w-8 h-8 rounded-lg border border-green-400 text-green-600 text-xs font-bold hover:bg-green-50 transition-colors flex items-center justify-center">
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center">
            <ThemeIcon className="w-4 h-4" />
          </button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 dark:bg-gray-900 border-r dark:border-gray-800">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
