import { NextResponse } from "next/server";
import { getCategories } from "@/data/categories";

export const dynamic = "force-dynamic";

// helper local para slug
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function GET() {
  try {
    const data = await getCategories();
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/categories] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const url  = `${(base || "").replace(/\/+$/,"")}/rest/v1/categories`;

    const name = String(body.name ?? "").trim();
    const position = Number(body.position ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // ⬇️ NADA de description; envie slug obrigatório
    const payload = {
      name,
      slug: slugify(name),
      position,
      icon: body.icon ?? null,
      color: body.color ?? null,
      active: true,
      deleted: false,
      deleted_at: null,
    };

    // (opcional) limitar os campos retornados
    const select =
      "id,name,slug,position,icon,color,active,deleted,deleted_at,created_at,updated_at";

    const res = await fetch(`${url}?select=${select}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // mostra erro claro no modal do front
      return NextResponse.json(
        { error: data?.message || data?.hint || data?.error || `Falha ao criar categoria (HTTP ${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    console.error("[/api/categories:POST] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
