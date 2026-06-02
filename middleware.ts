// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/chat/:path*',
    '/analytics/:path*',
    '/compare/:path*',
    '/templates/:path*',
    '/timeline/:path*',
    '/profile/:path*',
    '/account-settings/:path*',
    '/red-flags/:path*',
    '/translate/:path*',
    '/legal-qa/:path*',
  ],
}