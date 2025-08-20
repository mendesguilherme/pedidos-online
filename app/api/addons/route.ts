import { NextResponse } from "next/server"
import { getAddons } from "@/data/addons"

export async function GET() {
  try {
    const data = await getAddons()
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
