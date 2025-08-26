// src/data/addons.ts
import "server-only"

export interface Addon {
  id: number
  name: string
  price: number
  imageUrl: string
  /** miniaturas/variantes para otimização no painel */
  image_meta?: any
  /** público mantém compat: isActive vem de active (DB) */
  isActive?: boolean
}

export interface AddonAdmin extends Addon {
  active: boolean
  deleted: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type RowPublic = {
  id: number
  name: string
  price: number | string
  image_url: string
  image_meta?: any | null
  active?: boolean | null
}

type RowAdmin = RowPublic & {
  deleted: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
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

/** GET público (server-only) – mantém isActive para compat */
export async function getAddons(): Promise<Addon[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/addons` +
    `?select=id,name,price,image_url,image_meta,active` +
    `&deleted=eq.false` +
    `&order=id.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar addons: ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as RowPublic[]
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
    imageUrl: r.image_url,
    image_meta: r.image_meta ?? null,
    isActive: r.active ?? true,
  }))
}

/** GET admin – com flags de status */
export async function getAddonsForAdmin(): Promise<AddonAdmin[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/addons` +
    `?select=id,name,price,image_url,image_meta,active,deleted,created_at,updated_at,deleted_at` +
    `&deleted=eq.false` +
    `&order=id.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar addons (admin): ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as RowAdmin[]
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
    imageUrl: r.image_url,
    image_meta: r.image_meta ?? null,
    active: !!r.active,
    deleted: !!r.deleted,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at ?? null,
    // compat
    isActive: r.active ?? true,
  }))
}

/** CREATE (server-only) */
export async function createAddon(payload: { name: string; price: number; imageUrl?: string | null }) {
  const base = supabaseBase()
  const key  = serviceKey()

  const body = {
    name: String(payload.name).trim(),
    price: Number(payload.price ?? 0),
    image_url: payload.imageUrl ?? null,
    active: true,
    deleted: false,
    deleted_at: null,
  }

  const res = await fetch(`${base}/rest/v1/addons`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao criar addon: ${res.status} ${txt}`)
  }
  return res.json()
}

/** UPDATE (server-only) — envia só o que vier definido */
export async function updateAddon(
  id: number | string,
  updates: {
    name?: string
    price?: number
    imageUrl?: string | null
    active?: boolean
    deleted?: boolean
  }
) {
  const base = supabaseBase()
  const key  = serviceKey()

  const body: any = {}
  if (updates.name !== undefined)      body.name = String(updates.name)
  if (updates.price !== undefined)     body.price = Number(updates.price)
  if (updates.imageUrl !== undefined)  body.image_url = updates.imageUrl
  if (updates.active !== undefined)    body.active = !!updates.active
  if (updates.deleted !== undefined)   body.deleted = !!updates.deleted

  const res = await fetch(
    `${base}/rest/v1/addons?id=eq.${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  )

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao editar addon: ${res.status} ${txt}`)
  }
  return res.json()
}

/** SOFT DELETE (server-only) */
export async function softDeleteAddon(id: number | string) {
  return updateAddon(id, { deleted: true })
}
