// src/data/categories.ts
import "server-only"

export interface Category {
  id: string
  name: string
  slug: string
  position: number
  icon: string | null
  color: string | null
  active: boolean
  deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

function supabaseBase() {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new Error("SUPABASE_URL não definido")
  return base.replace(/\/+$/, "")
}
function serviceKey() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida")
  return k
}

/** Lista categorias não apagadas (segue padrão do products.ts). */
export async function getCategories(): Promise<Category[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/categories` +
    `?select=id,name,slug,position,icon,color,active,deleted,deleted_at,created_at,updated_at` +
    `&deleted=eq.false` +
    `&order=position.asc,name.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar categories: ${res.status} ${txt}`)
  }
  return (await res.json()) as Category[]
}
