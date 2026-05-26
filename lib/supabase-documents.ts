import { createClient } from "@/utils/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase-config"

export interface DocumentAnalysis {
  document_type: string
  parties: string[]
  key_dates: string[]
  key_clauses: string[]
  risk_score: number
  risk_level: "Low" | "Medium" | "High"
  risk_factors: string[]
  suggested_questions: string[]
}

export interface DocumentRecord {
  id: string
  user_id: string
  name: string
  analysis: DocumentAnalysis
  verification?: object
  notes?: string
  uploaded_at: string
}

async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return supabase
  } catch {
    return null
  }
}

export async function isSupabaseUser(): Promise<boolean> {
  return (await getAuthenticatedClient()) !== null
}

export async function saveDocument(params: {
  name: string
  analysis: DocumentAnalysis
  verification?: object
}): Promise<string | null> {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("documents")
      .insert({ user_id: user!.id, name: params.name, analysis: params.analysis, verification: params.verification ?? null })
      .select("id")
      .single()
    if (error) throw error
    return data.id as string
  } catch (e) {
    console.error("saveDocument failed:", e)
    return null
  }
}

export async function getDocuments(): Promise<DocumentRecord[]> {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, user_id, name, analysis, verification, uploaded_at")
      .order("uploaded_at", { ascending: false })
      .limit(20)
    if (error) throw error
    return (data ?? []) as DocumentRecord[]
  } catch (e) {
    console.error("getDocuments failed:", e)
    return []
  }
}

export async function updateNotes(id: string, notes: string): Promise<boolean> {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return false
  try {
    const { error } = await supabase.from("documents").update({ notes }).eq("id", id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("updateNotes failed:", e)
    return false
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const supabase = await getAuthenticatedClient()
  if (!supabase) return false
  try {
    const { error } = await supabase.from("documents").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (e) {
    console.error("deleteDocument failed:", e)
    return false
  }
}
