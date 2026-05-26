'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from './supabase-config'
import { cookies } from 'next/headers'

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = createClient()
    await supabase.auth.signOut()
  }
  // Clear local auth cookie
  const cookieStore = cookies()
  cookieStore.delete('nyay_local_user')
  return redirect('/login')
}
