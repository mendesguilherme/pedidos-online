// src/data/products.ts
import "server-only"

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
  /** categoria do produto (opcional para compat) */
  category?: CategoryLite | null
}

export interface ProductOptionWithLimits extends ProductOption {
  allowedToppingIds?: number[]          // NULL => undefined
  allowedAddonIds?: number[]            // NULL => undefined | [] => esconder
  requiredCreams?: number               // default 0
  allowedCreamIds?: number[]            // NULL => undefined
}

export type Product = ProductOption | ProductOptionWithLimits

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
  required_creams: number | null
  allowed_cream_ids: number[] | null
  /** novos campos para categoria */
  category_id: string | null
  category?: {
    id: string
    name: string
    slug: string
    position: number
    active: boolean
  } | null
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

/** Lista todos os produtos do banco (server-only). */
export async function getProducts(): Promise<Product[]> {
  const base = supabaseBase()
  const key = serviceKey()

  // Inclui category_id e o embed da tabela categories (apelidada como "category")
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
    // whitelists tri-state
    allowedToppingIds: r.allowed_topping_ids ?? undefined,
    allowedAddonIds:   r.allowed_addon_ids   ?? undefined,
    requiredCreams:    r.required_creams ?? 0,
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
