const PLACEHOLDER_SUPABASE_URL = "https://abcdefghijklmnop.supabase.co"

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
      anonKey &&
      url !== PLACEHOLDER_SUPABASE_URL &&
      anonKey !== "placeholder"
  )
}

export function getSupabaseConfigError() {
  return "Supabase is not configured for this local run. Using local demo auth instead."
}
