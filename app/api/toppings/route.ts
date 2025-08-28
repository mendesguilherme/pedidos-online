// app/api/toppings/route.ts
import { NextResponse } from "next/server"
import {
  getToppings,
  getToppingsForAdmin,
  getToppingsByIds,
  createTopping,
} from "@/data/toppings"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get("ids")
    const admin    = searchParams.get("admin") === "1"

    if (idsParam && idsParam.trim()) {
      const ids = idsParam.split(",").map(s => parseInt(s.trim(),10)).filter(n => Number.isFinite(n))
      const data = ids.length ? await getToppingsByIds(ids) : []
      return NextResponse.json({ data }, { status: 200 })
    }

    const data = admin ? await getToppingsForAdmin() : await getToppings()
    return NextResponse.json({ data }, { status: 200 })
  } catch (e:any) {
    console.error("[/api/toppings:GET] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? "").trim()
    if (!name) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })

    // 🔹 Aceita tanto camelCase quanto snake_case
    const imageUrl  = body?.imageUrl  ?? body?.image_url  ?? null
    const imageMeta = body?.imageMeta ?? body?.image_meta ?? null

    const data = await createTopping({ name, imageUrl, imageMeta })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e:any) {
    console.error("[/api/toppings:POST] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
