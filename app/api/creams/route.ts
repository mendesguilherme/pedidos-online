import { NextResponse } from "next/server"
import { getCreams } from "@/data/creams"

export async function GET() {
  try {
    const data = await getCreams()
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
