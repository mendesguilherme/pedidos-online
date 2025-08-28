// app/api/products/route.ts
import { NextResponse } from "next/server"
import { getProducts, getProductsForAdmin, createProduct } from "@/data/products"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const isAdmin = searchParams.get("admin") === "1"

    if (isAdmin) {
      const data = await getProductsForAdmin()
      return NextResponse.json({ data }, { status: 200 })
    }

    const data = await getProducts()
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/products:GET] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 🔹 Normalizações camel/snake + coerções numéricas
    const name         = String(body?.name ?? "").trim()
    const description  = String(body?.description ?? "")
    const price        = body?.price
    const imageUrl     = String(body?.imageUrl ?? body?.image_url ?? "")
    const maxToppings  = Number(body?.maxToppings ?? body?.max_toppings ?? 0)
    const volumeMl     = Number(body?.volumeMl ?? body?.volume_ml ?? 0)
    const categoryId   = String(body?.categoryId ?? body?.category_id ?? "")
    const slug         = body?.slug ?? null
    const position     = Number.isFinite(body?.position) ? Number(body.position) : 0

    // tri-state arrays
    const allowedToppingIds =
      ("allowedToppingIds" in body) ? (body.allowedToppingIds ?? null)
    : ("allowed_topping_ids" in body) ? (body.allowed_topping_ids ?? null)
    : undefined

    const allowedAddonIds =
      ("allowedAddonIds" in body) ? (body.allowedAddonIds ?? null)
    : ("allowed_addon_ids" in body) ? (body.allowed_addon_ids ?? null)
    : undefined

    // 🔹 (novo) aceita meta no POST (camel/snake)
    const imageMeta = body?.imageMeta ?? body?.image_meta ?? null

    // chama o createProduct preservando a tipagem existente;
    // passamos imageMeta junto via 'as any' (se o createProduct já suportar, ele persiste).
    const data = await (createProduct as any)({
      name,
      description,
      price,
      imageUrl,
      maxToppings,
      volumeMl,
      categoryId,
      slug,
      position,
      allowedToppingIds,
      allowedAddonIds,
      imageMeta, // ← compat com o padrão que fizemos em toppings/addons
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    console.error("[/api/products:POST] error:", e)
    const msg = String(e?.message ?? e)
    const is409 = /categoria inativa|conflit|duplicate|violates/i.test(msg)
    return NextResponse.json({ error: msg }, { status: is409 ? 409 : 400 })
  }
}
