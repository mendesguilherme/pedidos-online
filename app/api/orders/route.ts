export const runtime = "nodejs"        // garante Node (precisa p/ service role)
export const dynamic = "force-dynamic" // evita cache

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <<< precisa estar no .env.local
  )
}

export async function POST(req: Request) {
  try {
    const { cart, address } = await req.json()
    if (!cart?.items?.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })
    }

    const total =
      cart.items.reduce((s: number, it: any) => s + (it.price ?? 0) * (it.quantity ?? 1), 0) +
      (cart.tipo === "entrega" ? (cart.deliveryFee ?? 0) : 0)

    const { data, error } = await admin()
      .from("orders")
      .insert([{ tipo: cart.tipo, cart, address, payment_method: cart.paymentMethod, total }])
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, order: data?.[0] })
  } catch (err: any) {
    console.error("POST /api/orders:", err)
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? 50)

    const { data, error } = await admin()
      .from("orders")
      .select(`
        id,
        order_code,
        created_at,
        status,
        tipo,
        total,
        payment_method,
        cart,
        address
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ orders: data })
  } catch (err: any) {
    console.error("GET /api/orders:", err)
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 })
  }
}
