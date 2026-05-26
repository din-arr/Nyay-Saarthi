export interface LocalUser {
  email: string
  name: string
}

const LOCAL_USER_KEY = "nyay_local_user"
const COOKIE_NAME = "nyay_local_user"

export function createLocalSession(email: string): LocalUser {
  const user = { email, name: email.split("@")[0] || "User" }
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
    // Set cookie so server components (dashboard) can also read it
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))};path=/;max-age=604800;SameSite=Lax`
  }
  return user
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(LOCAL_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LocalUser
  } catch {
    localStorage.removeItem(LOCAL_USER_KEY)
    return null
  }
}

export function clearLocalSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_USER_KEY)
    document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`
  }
}

export function isAuthenticated() {
  return Boolean(getLocalUser())
}
