// app/api/addons/[id]/route.ts
import { NextResponse } from "next/server"
import { updateAddon, softDeleteAddon } from "@/data/addons"

export const dynamic = "force-dynamic"

// Next 15+: params é assíncrono
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const data = await updateAddon(id, {
      name:    body?.name,
      price:   "price" in body ? Number(body.price) : undefined,
      imageUrl: "imageUrl" in body ? body.imageUrl : ("image_url" in body ? body.image_url : undefined),
      active:  "active"  in body ? !!body.active  : undefined,
      deleted: "deleted" in body ? !!body.deleted : undefined,
    })

    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/addons/[id]:PATCH] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await softDeleteAddon(id)
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/addons/[id]:DELETE] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
