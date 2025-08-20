// app/api/toppings/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // evita prerender/otimização estática

function supabaseBase() {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("SUPABASE_URL não definido");
  return base.replace(/\/+$/, "");
}
function anonKey() {
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!k) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não definido");
  return k;
}

// GET /api/toppings
// Filtro opcional: /api/toppings?ids=1,2,3
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids"); // "1,2,3"

    const base = supabaseBase();
    const key = anonKey();

    let url = `${base}/rest/v1/toppings?select=id,name,image_url&order=name.asc`;

    // monta id=in.(...) só se houver ids válidos
    if (idsParam && idsParam.trim()) {
      const ids = idsParam
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n));
      if (ids.length) url += `&id=in.(${ids.join(",")})`;
    }

    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `PostgREST: ${res.status} ${t}` },
        { status: 500 }
      );
    }

    type Row = { id: number; name: string; image_url: string };
    const rows = (await res.json()) as Row[];

    // normaliza para o shape que o front espera
    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.image_url,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/toppings] error:", e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
