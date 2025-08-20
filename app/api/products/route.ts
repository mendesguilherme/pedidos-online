// app/api/products/route.ts
import { NextResponse } from "next/server"
import { getAcaiCups } from "@/data/products" // usa o MESMO nome da sua função

export async function GET() {
  try {
    const data = await getAcaiCups()
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
