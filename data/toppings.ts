// src/data/toppings.ts
import "server-only"

export interface Topping {
  id: number
  name: string
  imageUrl: string
}

type Row = { id: number; name: string; image_url: string }

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

/** Use em server components/actions/route handlers */
export async function getToppings(): Promise<Topping[]> {
  const base = supabaseBase()
  const key = serviceKey()

  const url = `${base}/rest/v1/toppings?select=id,name,image_url&order=name.asc`
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar toppings: ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as Row[]
  return rows.map(r => ({ id: r.id, name: r.name, imageUrl: r.image_url }))
}
