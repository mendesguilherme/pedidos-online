import { NextResponse } from "next/server"
import { updateTopping, softDeleteTopping } from "@/data/toppings"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const raw = await req.json()

    // Inclui somente campos definidos
    const updates: any = {}
    if (typeof raw.name !== "undefined")       updates.name = raw.name
    if (typeof raw.imageUrl !== "undefined")   updates.imageUrl = raw.imageUrl
    if (typeof raw.image_url !== "undefined")  updates.imageUrl = raw.image_url
    if (typeof raw.active !== "undefined")     updates.active = !!raw.active
    if (typeof raw.deleted !== "undefined")    updates.deleted = !!raw.deleted

    const data = await updateTopping(id, updates)
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    const status = e?.status || 500
    const msg = e?.message ? String(e.message) : "Falha ao editar topping"
    console.error("[/api/toppings/[id]:PATCH] error:", e)
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const data = await softDeleteTopping(id)
    return NextResponse.json({ data }, { status: 200 })
  } catch (e:any) {
    const status = e?.status || 500
    const msg = e?.message ? String(e.message) : "Falha ao excluir topping"
    console.error("[/api/toppings/[id]:DELETE] error:", e)
    return NextResponse.json({ error: msg }, { status })
  }
}
