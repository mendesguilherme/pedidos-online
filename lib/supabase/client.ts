// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
// ou: import { createClient } from '@supabase/supabase-js' (funciona também)
export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
