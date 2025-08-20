import { NextResponse } from "next/server"

function supabaseBase() {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new Error("SUPABASE_URL não definido")
  return base.replace(/\/+$/, "")
}
function anonKey() {
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!k) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não definido")
  return k
}

// GET /api/toppings
// Filtros opcionais: /api/toppings?ids=1,2,3
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = searchParams.get("ids") // csv
    const base = supabaseBase()
    const key = anonKey()

    let url = `${base}/rest/v1/toppings?select=id,name,image_url&order=name.asc`
    if (ids && ids.trim()) {
      const csv = ids.split(",").map(s => s.trim()).filter(Boolean).join(",")
      if (csv) url += `&id=in.(${csv})`
    }

    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const t = await res.text().catch(() => "")
      return NextResponse.json({ error: `PostgREST: ${res.status} ${t}` }, { status: 500 })
    }

    // normaliza o shape para o front
    const rows = (await res.json()) as Array<{ id: number; name: string; image_url: string }>
    const data = rows.map(r => ({ id: r.id, name: r.name, imageUrl: r.image_url }))

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
