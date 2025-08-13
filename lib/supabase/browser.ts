"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createClient(url, anon, {
    auth: {
      persistSession: false,       // evita usar localStorage
      autoRefreshToken: false,     // não precisa auto refresh se não há sessão
      detectSessionInUrl: false,   // não tenta ler sessão da URL
    },
    // realtime: { params: { eventsPerSecond: 5 } }, // opcional
  });

  return _client;
}
