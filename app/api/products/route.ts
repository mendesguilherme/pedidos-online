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

    const data = await createProduct({
      name: String(body?.name ?? "").trim(),
      description: String(body?.description ?? ""),
      price: body?.price,
      imageUrl: String(body?.imageUrl ?? body?.image_url ?? ""),
      maxToppings: Number(body?.maxToppings ?? body?.max_toppings ?? 0),
      volumeMl: Number(body?.volumeMl ?? body?.volume_ml ?? 0),
      categoryId: String(body?.categoryId ?? body?.category_id ?? ""),
      slug: body?.slug ?? null,
      position: Number.isFinite(body?.position) ? Number(body.position) : 0,
      // tri-state: undefined não enviado => vira NULL no createProduct
      allowedToppingIds: ("allowedToppingIds" in body) ? (body.allowedToppingIds ?? null)
                        : ("allowed_topping_ids" in body ? (body.allowed_topping_ids ?? null) : undefined),
      allowedAddonIds:   ("allowedAddonIds"   in body) ? (body.allowedAddonIds ?? null)
                        : ("allowed_addon_ids"   in body ? (body.allowed_addon_ids   ?? null) : undefined),
      requiredCreams: Number(body?.requiredCreams ?? body?.required_creams ?? 0),
      allowedCreamIds: ("allowedCreamIds" in body) ? (body.allowedCreamIds ?? null)
                        : ("allowed_cream_ids" in body ? (body.allowed_cream_ids ?? null) : undefined),
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    console.error("[/api/products:POST] error:", e)
    const msg = String(e?.message ?? e)
    const is409 = /categoria inativa|conflit|duplicate|violates/i.test(msg)
    return NextResponse.json({ error: msg }, { status: is409 ? 409 : 400 })
  }
}
