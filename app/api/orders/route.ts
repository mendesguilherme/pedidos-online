// /app/api/orders/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { buildAcceptDenyLinks /*, buildProgressLinks */ } from "@/lib/admin-actions"

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role
  )
}

function getClientIdFromHeaders(req: Request) {
  const h = req.headers.get("x-client-id") || ""
  return h.trim()
}

export async function POST(req: Request) {
  try {
    const clientId = getClientIdFromHeaders(req)
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

    // 1) insere o pedido
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

    // 2) fallback (raro): se vier null, busca o último do client_id
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

    // 3) Gera links de ação (JWT) para WhatsApp/Typebot
    const { aceitar, negar } = await buildAcceptDenyLinks(order.id)
    // Se já quiser os próximos status, descomente:
    // const { saiu, entregue } = await buildProgressLinks(order.id)

    // 4) Notifica o n8n (não bloqueante do fluxo de criação)
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.N8N_WEBHOOK_TOKEN
              ? { "X-Webhook-Token": process.env.N8N_WEBHOOK_TOKEN }
              : {}),
          },
          body: JSON.stringify({
            source: "orders_api",
            sentAt: new Date().toISOString(),
            clientId,
            order,
            actionLinks: {
              aceitar,
              negar,
              // saiu,
              // entregue,
            },
          }),
        })
      } catch (notifyErr) {
        // não derruba a criação do pedido
        console.warn("Falha ao notificar n8n (ignorado):", notifyErr)
      }
    }

    return NextResponse.json(
      {
        success: true,
        order,
        actionLinks: {
          aceitar,
          negar,
          // saiu,
          // entregue,
        },
      },
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
      .eq("client_id", clientId)
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
