import { NextResponse } from "next/server";
import { getCreams } from "@/data/creams";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCreams();
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/creams] error:", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
