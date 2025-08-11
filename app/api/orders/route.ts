// /app/api/orders/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role
  )
}

function getClientIdFromHeaders(req: Request) {
  // header que o browser vai enviar
  const h = req.headers.get("x-client-id") || ""
  return h.trim()
}

export async function POST(req: Request) {
  try {
    const clientId = req.headers.get("x-client-id")?.trim() || ""
    if (!clientId) {
      return NextResponse.json({ error: "Cliente não identificado" }, { status: 400 })
    }

    const { cart, address } = await req.json()
    if (!cart?.items?.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })
    }

    const total =
      cart.items.reduce((s: number, it: any) => s + (it.price ?? 0) * (it.quantity ?? 1), 0) +
      (cart.tipo === "entrega" ? (cart.deliveryFee ?? 0) : 0)

    const supa = admin()

    // 1) tenta inserir e já retornar a linha
    const { data: inserted, error: insErr } = await supa
      .from("orders")
      .insert([{
        client_id: clientId,
        tipo: cart.tipo,
        cart,
        address,
        payment_method: cart.paymentMethod,
        total,
      }])
      .select(`
        id, order_code, created_at, status, tipo, total, payment_method, cart, address, client_id
      `)
      .maybeSingle()

    if (insErr) throw insErr

    let order = inserted

    // 2) fallback: se veio vazio, busca o último pedido desse client_id
    if (!order) {
      const { data: fetched, error: selErr } = await supa
        .from("orders")
        .select(`
          id, order_code, created_at, status, tipo, total, payment_method, cart, address, client_id
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (selErr) throw selErr
      order = fetched
    }

    return NextResponse.json(
      { success: true, order },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    )
  } catch (err: any) {
    console.error("POST /api/orders:", err)
    return NextResponse.json(
      { error: err.message ?? "Erro interno" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const clientId = getClientIdFromHeaders(req)
    if (!clientId) {
      return NextResponse.json({ error: "Cliente não identificado" }, { status: 400 })
    }

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
        address,
        client_id
      `)
      .eq("client_id", clientId)               // 🔴 filtra pelo dono
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return NextResponse.json(
      { orders: data },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    )
  } catch (err: any) {
    console.error("GET /api/orders:", err)
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 })
  }
}
