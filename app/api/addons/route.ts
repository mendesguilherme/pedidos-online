import { NextResponse } from "next/server";
import { getAddons } from "@/data/addons";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAddons();
    // filtra inativos se houver flag
    return NextResponse.json({ data: (data ?? []).filter(a => a.isActive ?? true) });
  } catch (e: any) {
    console.error("[/api/addons] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
