"use client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

export function getSupabaseBrowser() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // durante build/prerender, apenas não inicializa
    if (typeof window === "undefined") return null as any
    throw new Error("Env do Supabase ausente no cliente.")
  }
  _client = createClient(url, anon)
  return _client
}
