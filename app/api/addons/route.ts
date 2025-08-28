// app/api/addons/route.ts
import { NextResponse } from "next/server";
import { getAddons, getAddonsForAdmin, createAddon } from "@/data/addons";

export const dynamic = "force-dynamic";

function isEffectivelyActive(a: any): boolean {
  // aceita active/isActive; quando ausente, default = true; respeita deleted
  const active = typeof a?.active === "boolean" ? a.active
               : typeof a?.isActive === "boolean" ? a.isActive
               : true;
  const deleted = typeof a?.deleted === "boolean" ? a.deleted : false;
  return active && !deleted;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "1";

    if (isAdmin) {
      const data = await getAddonsForAdmin();
      return NextResponse.json({ data }, { status: 200 });
    }

    const data = await getAddons();
    return NextResponse.json(
      { data: (data ?? []).filter(isEffectivelyActive) },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/addons:GET] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const priceRaw = body?.price;
    const price = Number(priceRaw);

    const imageUrlInput = body?.imageUrl ?? body?.image_url ?? null;
    const imageUrl =
      typeof imageUrlInput === "string" && imageUrlInput.trim().length > 0
        ? imageUrlInput.trim()
        : null;

    // novo: aceitar meta vindo do uploader “detached”
    const imageMeta = body?.imageMeta ?? body?.image_meta ?? null;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }

    const data = await createAddon({ name, price, imageUrl, imageMeta });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    console.error("[/api/addons:POST] error:", e);
    const msg = String(e?.message ?? e);
    const code = String(e?.code ?? "");
    const is409 =
      code === "23505" ||
      /duplicate key|violates unique|unique constraint|23505/i.test(msg);
    return NextResponse.json({ error: msg }, { status: is409 ? 409 : 500 });
  }
}
