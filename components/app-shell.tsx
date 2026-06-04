'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { createClient } from '@/utils/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase-config'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem('nyay_sidebar_collapsed') === 'true')

    // Local auth — instant, just a localStorage read
    try {
      const raw = localStorage.getItem('nyay_local_user')
      if (raw) {
        const u = JSON.parse(raw)
        setUserEmail(u.email ?? null)
        setUserName(u.name ?? u.email?.split('@')[0] ?? null)
      }
    } catch {}

    // Supabase — use getSession (cookie read, no network) instead of getUser (network call)
    if (isSupabaseConfigured()) {
      createClient().auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email ?? null)
          setUserName(session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? null)
        }
      }).catch(() => {})
    }

    const onToggle = () => setCollapsed(localStorage.getItem('nyay_sidebar_collapsed') === 'true')
    window.addEventListener('nyay_sidebar_toggle', onToggle)
    return () => window.removeEventListener('nyay_sidebar_toggle', onToggle)
  }, [])

  return (
    <>
      <Sidebar userEmail={userEmail} userName={userName} />
      <main className={`transition-all duration-200 md:pt-0 pt-14 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {children}
      </main>
    </>
  )
}
