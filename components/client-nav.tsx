'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, LogOut, BarChart3, MessageSquare, Phone, Sun, Moon, UserCircle, GitCompare, FileEdit, CalendarClock, PieChart, Shield, Languages, Scale } from 'lucide-react'
import { signOut } from '@/lib/actions'
import { useLanguage } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ClientNavProps {
  userEmail: string | null
  userName: string | null
}

export function ClientNav({ userEmail, userName }: ClientNavProps) {
  const { lang, setLang, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [resolvedEmail, setResolvedEmail] = useState(userEmail)
  const [resolvedName, setResolvedName] = useState(userName)

  useEffect(() => {
    setMounted(true)
    // Client-side fallback: server cookie read sometimes misses on first load
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

  const ThemeIcon = mounted ? (theme === 'dark' ? Sun : Moon) : Moon

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: BarChart3 },
    { href: '/chat', label: t('aiChat'), icon: MessageSquare },
    { href: '/legal-qa', label: lang === 'hi' ? 'कानूनी Q&A' : 'Legal Q&A', icon: Scale },
    { href: '/analytics', label: lang === 'hi' ? 'विश्लेषण' : 'Analytics', icon: PieChart },
    { href: '/compare', label: t('compare'), icon: GitCompare },
    { href: '/templates', label: t('templates'), icon: FileEdit },
    { href: '/red-flags', label: lang === 'hi' ? 'रेड-फ्लैग' : 'Red Flags', icon: Shield },
    { href: '/translate', label: lang === 'hi' ? 'अनुवाद' : 'Translate', icon: Languages },
    { href: '/timeline', label: t('timeline'), icon: CalendarClock },
    { href: '/consultation', label: t('consultation'), icon: User },
    { href: '/support', label: t('support'), icon: Phone },
  ]

  const Toggles = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        className="text-xs font-bold px-3 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent min-w-[42px]"
        title={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
      >
        {lang === 'hi' ? 'EN' : 'हिं'}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <ThemeIcon className="h-4 w-4" />
      </Button>
    </>
  )

  return (
    <>
      {/* ── Desktop nav ── */}
      <nav className="hidden md:flex items-center gap-3">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium text-sm"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}

        <div className="flex items-center gap-1.5">
          {Toggles}

          {resolvedEmail ? (
            /* Profile button — simple Link, no dropdown (avoids portal z-index bugs) */
            <Link href="/profile">
              <Button
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent gap-2"
              >
                <User className="h-4 w-4" />
                {resolvedName ?? resolvedEmail.split('@')[0]}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="!bg-green-600 hover:!bg-green-700 text-white shadow-lg border-0">
                  {t('getStarted')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Mobile ── */}
      <div className="md:hidden flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          className="text-xs font-bold px-2 border-green-600 text-green-600 hover:bg-green-50 bg-transparent h-8">
          {lang === 'hi' ? 'EN' : 'हिं'}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-gray-600 dark:text-gray-300 h-8 w-8">
          <ThemeIcon className="h-4 w-4" />
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost"><Menu className="h-6 w-6" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="dark:bg-gray-900">
            <div className="flex flex-col gap-4 py-6">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-200 hover:text-green-600 transition-colors font-medium">
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t dark:border-gray-700 pt-4 mt-2 flex flex-col gap-2">
                {resolvedEmail ? (
                  <>
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-1 truncate">{resolvedEmail}</p>
                    <Link href="/profile" className="w-full">
                      <Button variant="outline" className="w-full border-green-600 text-green-600">
                        <UserCircle className="h-4 w-4 mr-2" />
                        {lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
                      </Button>
                    </Link>
                    <form action={signOut}>
                      <Button type="submit" variant="destructive" className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('logout')}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full border-green-600 text-green-600">{t('login')}</Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button className="w-full !bg-green-600 hover:!bg-green-700 text-white">{t('getStarted')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
