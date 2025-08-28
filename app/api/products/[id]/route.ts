// app/api/products/[id]/route.ts
import { NextResponse } from "next/server"
import { updateProduct, softDeleteProduct } from "@/data/products"

export const dynamic = "force-dynamic"

// Next 15+: params é assíncrono
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // Mapeia apenas campos presentes — evita sobrescrever com vazio/undefined
    const updates: {
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
      deleted?: boolean
    } = {}

    if ("name" in body)               updates.name = body.name
    if ("description" in body)        updates.description = body.description
    if ("price" in body)              updates.price = body.price

    // 🔹 Normaliza imageUrl: aceita camel/snake; "" => null; ausente => undefined
    const imageUrlRaw =
      "imageUrl" in body ? body.imageUrl :
      ("image_url" in body ? body.image_url : undefined)
    if (imageUrlRaw !== undefined) {
      updates.imageUrl =
        typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0
          ? imageUrlRaw.trim()
          : null
    }

    if ("maxToppings" in body)        updates.maxToppings = body.maxToppings
    else if ("max_toppings" in body)  updates.maxToppings = body.max_toppings

    if ("volumeMl" in body)           updates.volumeMl = body.volumeMl
    else if ("volume_ml" in body)     updates.volumeMl = body.volume_ml

    if ("categoryId" in body)         updates.categoryId = body.categoryId
    else if ("category_id" in body)   updates.categoryId = body.category_id

    if ("active" in body)             updates.active = !!body.active
    if ("slug" in body)               updates.slug = body.slug
    if ("position" in body)           updates.position = body.position

    if ("allowedToppingIds" in body)        updates.allowedToppingIds = body.allowedToppingIds
    else if ("allowed_topping_ids" in body) updates.allowedToppingIds = body.allowed_topping_ids

    if ("allowedAddonIds" in body)          updates.allowedAddonIds = body.allowedAddonIds
    else if ("allowed_addon_ids" in body)   updates.allowedAddonIds = body.allowed_addon_ids

    if ("deleted" in body)                  updates.deleted = !!body.deleted

    const data = await updateProduct(id, updates)
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/products/[id]:PATCH] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await softDeleteProduct(id)
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/products/[id]:DELETE] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
