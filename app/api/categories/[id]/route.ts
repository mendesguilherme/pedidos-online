// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";

function base() {
  const b = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!b) throw new Error("SUPABASE_URL não definido");
  return b.replace(/\/+$/, "");
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function hasActiveProducts(categoryId: string): Promise<boolean> {
  const b = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const baseUrl = b.replace(/\/+$/, "");
  const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // Se a sua tabela products tiver 'active', mantenha o filtro; caso não tenha, o fallback abaixo cobre.
  const url =
    `${baseUrl}/rest/v1/products` +
    `?select=id` +
    `&category_id=eq.${encodeURIComponent(categoryId)}` +
    `&active=eq.true` +
    `&limit=1`;

  const res = await fetch(url, {
    headers: { apikey: srvKey, Authorization: `Bearer ${srvKey}` },
    cache: "no-store",
  });

  // Se der 400 por coluna inexistente ('active'), refaça sem o filtro:
  if (res.status === 400) {
    const res2 = await fetch(
      `${baseUrl}/rest/v1/products?select=id&category_id=eq.${encodeURIComponent(
        categoryId
      )}&limit=1`,
      { headers: { apikey: srvKey, Authorization: `Bearer ${srvKey}` }, cache: "no-store" }
    );
    if (!res2.ok) {
      const txt = await res2.text().catch(() => "");
      throw new Error(`Falha ao checar produtos (fallback): ${res2.status} ${txt}`);
    }
    const rows2 = (await res2.json()) as any[];
    return Array.isArray(rows2) && rows2.length > 0;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao checar produtos: ${res.status} ${txt}`);
  }
  const rows = (await res.json()) as any[];
  return Array.isArray(rows) && rows.length > 0;
}

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const updates: any = {};
    if ("name" in body) updates.name = String(body.name);
    if ("position" in body) updates.position = Number(body.position);
    if ("icon" in body) updates.icon = body.icon ?? null;
    if ("color" in body) updates.color = body.color ?? null;
    if ("active" in body) updates.active = !!body.active;
    if ("deleted" in body) updates.deleted = !!body.deleted;

    // ⚠️ bloqueia tentar inativar/deletar se houver produto ativo
    if (updates.active === false || updates.deleted === true) {
      if (await hasActiveProducts(id)) {
        return NextResponse.json(
          { error: "Não é possível inativar/excluir: existem produtos ativos nessa categoria." },
          { status: 409 }
        );
      }
    }

    const url = `${base()}/rest/v1/categories?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as any)?.message || (data as any)?.hint || (data as any)?.error || "Falha ao editar categoria" },
        { status: res.status }
      );
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/categories/[id]:PATCH] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ⚠️ mesma checagem antes do soft delete
    if (await hasActiveProducts(id)) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem produtos ativos nessa categoria." },
        { status: 409 }
      );
    }

    const url = `${base()}/rest/v1/categories?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ deleted: true }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as any)?.message || (data as any)?.hint || (data as any)?.error || "Falha ao excluir categoria" },
        { status: res.status }
      );
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/categories/[id]:DELETE] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
