// src/data/addons.ts
import "server-only"

export interface Addon {
  id: number
  name: string
  price: number
  imageUrl: string
  isActive?: boolean
}

type Row = {
  id: number
  name: string
  price: number | string
  image_url: string
  is_active?: boolean | null
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

/** Lista os adicionais (server-only). */
export async function getAddons(): Promise<Addon[]> {
  const base = supabaseBase()
  const key = serviceKey()

  // ajuste o nome da tabela se for diferente de "addons"
  const url = `${base}/rest/v1/addons?select=id,name,price,image_url,is_active&order=id.asc`
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar addons: ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as Row[]
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
    imageUrl: r.image_url,
    isActive: r.is_active ?? true,
  }))
}
