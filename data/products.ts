// src/data/products.ts
import "server-only"

/** ---------- Tipos ---------- */
export interface CategoryLite {
  id: string
  name: string
  slug: string
  position: number
  active: boolean
}

export interface ProductOption {
  id: number
  name: string
  description: string
  price: number
  image: string
  maxToppings: number
  volumeMl: number
  /** categoria (opcional para compat) */
  category?: CategoryLite | null
}

export interface ProductOptionWithLimits extends ProductOption {
  allowedToppingIds?: number[]          // NULL => undefined (sem restrição)
  allowedAddonIds?: number[]            // NULL => undefined
  requiredCreams?: number               // default 0
  allowedCreamIds?: number[]            // NULL => undefined
}

/** Tipo público (GET) já existente */
export type Product = ProductOption | ProductOptionWithLimits

/** Tipo admin (com campos extras) */
export interface ProductAdmin extends ProductOptionWithLimits {
  active: boolean
  deleted: boolean
  slug: string | null
  position: number
  category_id: string | null
  created_at: string
  updated_at: string
}

type Row = {
  id: number
  name: string
  description: string
  price: number | string
  image_url: string
  max_toppings: number
  volume_ml: number
  allowed_topping_ids: number[] | null
  allowed_addon_ids: number[] | null
  required_creams: number | string | null
  allowed_cream_ids: number[] | null
  category_id: string | null
  category?: {
    id: string
    name: string
    slug: string
    position: number
    active: boolean
  } | null
  // admin
  active?: boolean
  deleted?: boolean
  slug?: string | null
  position?: number
  created_at?: string
  updated_at?: string
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

/** ---------- GET público (mantém seu contrato existente) ---------- */
export async function getProducts(): Promise<Product[]> {
  const base = supabaseBase()
  const key = serviceKey()

  const url =
    `${base}/rest/v1/products` +
    `?select=` +
      `id,name,description,price,image_url,` +
      `max_toppings,volume_ml,` +
      `allowed_topping_ids,allowed_addon_ids,required_creams,allowed_cream_ids,` +
      `category_id,` +
      `category:categories(id,name,slug,position,active)` +
    `&order=id.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar products: ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as Row[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
    image: r.image_url,
    maxToppings: r.max_toppings,
    volumeMl: r.volume_ml,
    // tri-state
    allowedToppingIds: r.allowed_topping_ids ?? undefined,
    allowedAddonIds:   r.allowed_addon_ids   ?? undefined,
    requiredCreams:    r.required_creams != null ? Number(r.required_creams) : 0,
    allowedCreamIds:   r.allowed_cream_ids ?? undefined,
    // categoria (opcional)
    category: r.category
      ? {
          id: r.category.id,
          name: r.category.name,
          slug: r.category.slug,
          position: r.category.position,
          active: !!r.category.active,
        }
      : null,
  }))
}

/** ---------- GET admin (com campos extra) ---------- */
export async function getProductsForAdmin(): Promise<ProductAdmin[]> {
  const base = supabaseBase()
  const key  = serviceKey()

  const url =
    `${base}/rest/v1/products` +
    `?select=` +
      `id,name,description,price,image_url,` +
      `max_toppings,volume_ml,` +
      `allowed_topping_ids,allowed_addon_ids,required_creams,allowed_cream_ids,` +
      `active,deleted,slug,position,` +
      `created_at,updated_at,` +
      `category_id,` +
      `category:categories(id,name,slug,position,active)` +
    `&deleted=eq.false` +
    `&order=position.asc,id.asc`

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao listar products (admin): ${res.status} ${txt}`)
  }

  const rows = (await res.json()) as Row[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
    image: r.image_url,
    maxToppings: r.max_toppings,
    volumeMl: r.volume_ml,
    allowedToppingIds: r.allowed_topping_ids ?? undefined,
    allowedAddonIds:   r.allowed_addon_ids   ?? undefined,
    requiredCreams:    r.required_creams != null ? Number(r.required_creams) : 0,
    allowedCreamIds:   r.allowed_cream_ids ?? undefined,
    active: !!r.active,
    deleted: !!r.deleted,
    slug: r.slug ?? null,
    position: Number(r.position ?? 0),
    category_id: r.category_id ?? null,
    created_at: r.created_at!,
    updated_at: r.updated_at!,
    category: r.category
      ? {
          id: r.category.id,
          name: r.category.name,
          slug: r.category.slug,
          position: r.category.position,
          active: !!r.category.active,
        }
      : null,
  }))
}

/** ---------- Validadores utilitários ---------- */
function ensureNonNegativeInt(n: any, field: string) {
  const v = Number(n)
  if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
    throw new Error(`${field} deve ser um inteiro >= 0`)
  }
  return v
}
function ensurePrice(n: any) {
  const v = typeof n === "string" ? parseFloat(n) : Number(n ?? 0)
  if (!Number.isFinite(v) || v < 0) throw new Error("Preço inválido")
  return v
}
function toNumArrayOrNull(a: any): number[] | null {
  if (a == null) return null
  if (!Array.isArray(a)) throw new Error("Esperado array de números")
  const out: number[] = []
  for (const x of a) {
    const n = Number(x)
    if (!Number.isFinite(n)) throw new Error("IDs devem ser numéricos")
    out.push(n)
  }
  return out
}

/** Verifica se a categoria existe e está ativa (não deletada) */
export async function assertCategoryActive(categoryId: string) {
  const base = supabaseBase()
  const key  = serviceKey()
  const url  = `${base}/rest/v1/categories?id=eq.${encodeURIComponent(categoryId)}&select=id,active,deleted&limit=1`
  const res  = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao validar categoria: ${res.status} ${txt}`)
  }
  const rows = await res.json() as { id:string; active:boolean; deleted:boolean }[]
  const row = rows[0]
  if (!row) throw new Error("Categoria inválida")
  if (!row.active || row.deleted) throw new Error("Categoria inativa ou removida")
}

/** ---------- CREATE ---------- */
export async function createProduct(payload: {
  name: string
  description?: string
  price: number
  imageUrl: string
  maxToppings: number
  volumeMl: number
  categoryId: string
  slug?: string | null
  position?: number
  allowedToppingIds?: number[] | null // null = sem restrição | [] = esconder
  allowedAddonIds?: number[] | null
  requiredCreams?: number
  allowedCreamIds?: number[] | null
}) {
  const base = supabaseBase()
  const key  = serviceKey()

  // validações
  const name = String(payload.name ?? "").trim()
  if (!name) throw new Error("Nome é obrigatório")
  const price = ensurePrice(payload.price)
  const max_toppings = ensureNonNegativeInt(payload.maxToppings, "max_toppings")
  const volume_ml    = ensureNonNegativeInt(payload.volumeMl, "volume_ml")
  const required_creams = Number.isFinite(payload.requiredCreams as any) ? Number(payload.requiredCreams) : 0
  const position = Number.isFinite(payload.position as any) ? Number(payload.position) : 0
  const category_id = String(payload.categoryId || "").trim()
  if (!category_id) throw new Error("category_id é obrigatório")

  // se o produto for criado como ativo (padrão), garanta category ativa
  await assertCategoryActive(category_id)

  const body = {
    name,
    description: String(payload.description ?? ""),
    price,
    image_url: String(payload.imageUrl ?? ""),
    max_toppings,
    volume_ml,
    allowed_topping_ids: payload.allowedToppingIds ?? null,
    allowed_addon_ids:   payload.allowedAddonIds   ?? null,
    required_creams,
    allowed_cream_ids:   payload.allowedCreamIds ?? null,
    active: true,
    slug: payload.slug ?? null,
    position,
    attributes: {},
    category_id,
    deleted: false,
  }

  const res = await fetch(`${base}/rest/v1/products?select=id`, {
    method: "POST",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao criar product: ${res.status} ${txt}`)
  }
  return res.json()
}

/** ---------- UPDATE ---------- */
export async function updateProduct(id: number | string, updates: {
  name?: string
  description?: string
  price?: number
  imageUrl?: string | null
  maxToppings?: number
  volumeMl?: number
  categoryId?: string | null
  active?: boolean
  slug?: string | null
  position?: number
  allowedToppingIds?: number[] | null
  allowedAddonIds?: number[] | null
  requiredCreams?: number
  allowedCreamIds?: number[] | null
  deleted?: boolean
}) {
  const base = supabaseBase()
  const key  = serviceKey()

  const body: any = {}

  if (typeof updates.name !== "undefined") body.name = String(updates.name)
  if (typeof updates.description !== "undefined") body.description = String(updates.description ?? "")
  if (typeof updates.price !== "undefined") body.price = ensurePrice(updates.price)
  if (typeof updates.imageUrl !== "undefined") body.image_url = String(updates.imageUrl ?? "")
  if (typeof updates.maxToppings !== "undefined") body.max_toppings = ensureNonNegativeInt(updates.maxToppings, "max_toppings")
  if (typeof updates.volumeMl !== "undefined") body.volume_ml = ensureNonNegativeInt(updates.volumeMl, "volume_ml")
  if (typeof updates.requiredCreams !== "undefined") body.required_creams = Number(updates.requiredCreams ?? 0)
  if (typeof updates.position !== "undefined") body.position = Number(updates.position ?? 0)
  if (typeof updates.slug !== "undefined") body.slug = updates.slug ?? null
  if (typeof updates.allowedToppingIds !== "undefined") body.allowed_topping_ids = toNumArrayOrNull(updates.allowedToppingIds)
  if (typeof updates.allowedAddonIds   !== "undefined") body.allowed_addon_ids   = toNumArrayOrNull(updates.allowedAddonIds)
  if (typeof updates.allowedCreamIds   !== "undefined") body.allowed_cream_ids   = toNumArrayOrNull(updates.allowedCreamIds)
  if (typeof updates.deleted !== "undefined") body.deleted = !!updates.deleted

  if (typeof updates.categoryId !== "undefined") {
    const c = (updates.categoryId ?? "").trim()
    body.category_id = c || null
    if (c) await assertCategoryActive(c)
  }

  if (typeof updates.active !== "undefined") {
    body.active = !!updates.active
    // se tentar ativar, certifique-se que a categoria está OK (a atual ou a nova)
    if (body.active === true) {
      // recupera category_id (novo no body ou atual via quick fetch)
      let cid: string | null = body.category_id ?? null
      if (!cid) {
        const url = `${base}/rest/v1/products?id=eq.${encodeURIComponent(String(id))}&select=category_id&limit=1`
        const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" })
        if (res.ok) {
          const rows = await res.json() as { category_id: string | null }[]
          cid = rows[0]?.category_id ?? null
        }
      }
      if (cid) await assertCategoryActive(cid)
      else throw new Error("category_id obrigatório para ativar o produto")
    }
  }

  const url = `${base}/rest/v1/products?id=eq.${encodeURIComponent(String(id))}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Falha ao editar product: ${res.status} ${txt}`)
  }
  return res.json()
}

/** ---------- SOFT DELETE ---------- */
export async function softDeleteProduct(id: number | string) {
  return updateProduct(id, { deleted: true })
}
