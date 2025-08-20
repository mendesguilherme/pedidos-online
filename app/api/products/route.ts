import { NextResponse } from "next/server";
import { getAcaiCups } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAcaiCups();
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/products] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
