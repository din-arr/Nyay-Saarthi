import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase-config"
import { DashboardUI } from "./dashboard-ui"

export default async function Dashboard() {
  let displayName = "उपयोगकर्ता"

  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect("/login")
    displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "उपयोगकर्ता"
  } else {
    const cookieStore = cookies()
    const localUserCookie = cookieStore.get("nyay_local_user")
    if (!localUserCookie) return redirect("/login")
    try {
      const localUser = JSON.parse(decodeURIComponent(localUserCookie.value))
      displayName = localUser.name || localUser.email?.split("@")[0] || "उपयोगकर्ता"
    } catch {
      return redirect("/login")
    }
  }

  return <DashboardUI displayName={displayName} />
}
