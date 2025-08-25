// app/api/addons/route.ts
import { NextResponse } from "next/server"
import { getAddons, getAddonsForAdmin, createAddon } from "@/data/addons"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const isAdmin = searchParams.get("admin") === "1"

    if (isAdmin) {
      const data = await getAddonsForAdmin()
      return NextResponse.json({ data }, { status: 200 })
    }

    const data = await getAddons()
    // mantém padrão dos outros: filtra inativos no GET público
    return NextResponse.json({ data: (data ?? []).filter(a => a.isActive ?? true) }, { status: 200 })
  } catch (e: any) {
    console.error("[/api/addons:GET] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? "").trim()
    const price = Number(body?.price ?? 0)
    const imageUrl = body?.imageUrl ?? body?.image_url ?? null

    if (!name)  return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 })
    }

    const data = await createAddon({ name, price, imageUrl })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    console.error("[/api/addons:POST] error:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
