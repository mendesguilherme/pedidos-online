// src/data/toppings.ts
import "server-only"

export interface Topping {
  id: number
  name: string
  imageUrl: string
}

export interface ToppingAdmin extends Topping {
  active: boolean
  deleted: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
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

/** Público (ou uso geral): somente ativos e não deletados */
export async function getToppings(): Promise<Topping[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/toppings` +
    `?select=id,name,image_url` +
    `&active=eq.true&deleted=eq.false` +
    `&order=name.asc`

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

/** Admin: com campos de status; apenas não deletados */
export async function getToppingsForAdmin(): Promise<ToppingAdmin[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/toppings` +
    `?select=id,name,image_url,active,deleted,created_at,updated_at,deleted_at` +
    `&deleted=eq.false` +
    `&order=name.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar toppings (admin): ${res.status} ${txt}`)
  }
  const rows = await res.json() as any[]
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    imageUrl: r.image_url,
    active: !!r.active,
    deleted: !!r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at ?? null,
  }))
}

/** Filtro opcional por ids (mantém apenas ativos e não deletados) */
export async function getToppingsByIds(ids: number[]): Promise<Topping[]> {
  if (!ids?.length) return []
  const base = supabaseBase()
  const key  = serviceKey()
  const url =
    `${base}/rest/v1/toppings?select=id,name,image_url` +
    `&id=in.(${ids.join(",")})` +
    `&active=eq.true&deleted=eq.false` +
    `&order=name.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar toppings por ids: ${res.status} ${txt}`)
  }
  const rows = await res.json() as { id:number; name:string; image_url:string }[]
  return rows.map(r => ({ id: r.id, name: r.name, imageUrl: r.image_url }))
}

/** CRUD (server-only) */
export async function createTopping(payload: { name: string; imageUrl?: string | null }) {
  const base = supabaseBase()
  const key  = serviceKey()
  const res = await fetch(`${base}/rest/v1/toppings`, {
    method: "POST",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type":"application/json", Prefer:"return=representation"
    },
    body: JSON.stringify({
      name: String(payload.name).trim(),
      image_url: payload.imageUrl ?? null,
      active: true,
      deleted: false,
      deleted_at: null,
    }),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao criar topping: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function updateTopping(
  id: number | string,
  updates: { name?: string; imageUrl?: string | null; active?: boolean; deleted?: boolean }
) {
  const base = supabaseBase()
  const key  = serviceKey()
  const body: any = {}

  if (typeof updates.name !== "undefined")     body.name       = String(updates.name)
  if (typeof updates.imageUrl !== "undefined") body.image_url  = updates.imageUrl ?? null
  if (typeof updates.active !== "undefined")   body.active     = !!updates.active
  if (typeof updates.deleted !== "undefined")  body.deleted    = !!updates.deleted

  const res = await fetch(`${base}/rest/v1/toppings?id=eq.${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type":"application/json", Prefer:"return=representation"
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    let message = txt
    try {
      const j = JSON.parse(txt)
      message = j?.message || j?.hint || j?.error || message
    } catch {}
    const err: any = new Error(message)
    err.status = res.status
    err.raw = txt
    throw err
  }

  return res.json()
}

export async function softDeleteTopping(id: number | string) {
  // marca como deletado e inativo
  return updateTopping(id, { deleted: true, active: false })
}
