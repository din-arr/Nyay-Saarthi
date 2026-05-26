import Link from 'next/link'
import { Scale } from 'lucide-react'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase-config'
import { ClientNav } from '@/components/client-nav'

export async function Header() {
  let userEmail: string | null = null
  let userName: string | null = null

  if (isSupabaseConfigured()) {
    const { data: { user } } = await createClient().auth.getUser()
    userEmail = user?.email ?? null
    userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? null
  } else {
    const cookieStore = cookies()
    const localUserCookie = cookieStore.get('nyay_local_user')
    if (localUserCookie) {
      try {
        const localUser = JSON.parse(decodeURIComponent(localUserCookie.value))
        userEmail = localUser.email ?? null
        userName = localUser.name ?? localUser.email?.split('@')[0] ?? null
      } catch {}
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-green-100 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-xl shadow-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">कानूनी सहायक</h1>
              <p className="text-xs text-green-600 font-medium">Legal Helper AI</p>
            </div>
          </Link>

          <ClientNav userEmail={userEmail} userName={userName} />
        </div>
      </div>
    </header>
  )
}
