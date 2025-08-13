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
  return (req.headers.get("x-client-id") || "").trim()
}

/** Envia payload pro n8n sem quebrar a request principal */
async function notifyN8n(payload: any) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return // sem URL => não tenta

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = process.env.N8N_WEBHOOK_TOKEN
  if (token) headers["X-Webhook-Token"] = token

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 3500) // timeout de ~3.5s

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      console.error(`[n8n] HTTP ${res.status} ${res.statusText} - ${txt}`)
    }
  } catch (err) {
    console.error("[n8n] Falha ao notificar:", err)
  } finally {
    clearTimeout(t)
  }
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
    // const { saiu, entregue } = await buildProgressLinks(order.id)

    // 4) Dispara o n8n (fire-and-forget, não bloqueia e não quebra a resposta)
    notifyN8n({
      source: "orders_api",
      sentAt: new Date().toISOString(),
      clientId,
      order,
      actionLinks: { aceitar, negar /*, saiu, entregue */ },
    }).catch(() => {}) // já tem try/catch interno, mas garantimos

    // 5) Responde sucesso imediatamente
    return NextResponse.json(
      {
        success: true,
        order,
        actionLinks: { aceitar, negar /*, saiu, entregue */ },
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
