// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'
import 'server-only'

export const createSupabaseServerClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL pode ser pública
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role (só no servidor)
    { auth: { persistSession: false } }
  )
