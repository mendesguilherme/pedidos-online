// app/api/admin/order-action/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyActionToken, type OrderAction } from "@/lib/admin-jwt"

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error("Supabase envs ausentes")
  return createClient(url, key)
}

function mapActionToStatus(action: OrderAction | string) {
  switch (action) {
    case "aceitar":
      return "em_preparo"
    case "negar":
      return "cancelado"
    case "saiu_para_entrega":
      return "saiu_para_entrega"
    case "entregue":
      return "entregue"
    default:
      return null
  }
}

const HTML_OK = (msg: string) => `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Pedido atualizado</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Noto Sans",sans-serif;background:#f8fafc;margin:0;padding:24px}
  .card{max-width:560px;margin:32px auto;background:white;border:1px solid #e5e7eb;border-radius:14px;padding:24px;box-shadow:0 6px 20px rgba(0,0,0,.06)}
  .ok{color:#16a34a;font-weight:700}
</style>
</head><body>
  <div class="card">
    <div class="ok">✔ ${msg}</div>
    <p>Você pode fechar esta página.</p>
  </div>
</body></html>`

const HTML_ERR = (msg: string) => `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Erro</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Noto Sans",sans-serif;background:#fff7f7;margin:0;padding:24px}
  .card{max-width:560px;margin:32px auto;background:white;border:1px solid #fecaca;border-radius:14px;padding:24px;box-shadow:0 6px 20px rgba(0,0,0,.06)}
  .err{color:#dc2626;font-weight:700}
</style>
</head><body>
  <div class="card">
    <div class="err">✖ ${msg}</div>
    <p>Tente novamente a partir do link do WhatsApp.</p>
  </div>
</body></html>`

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    // Normaliza parâmetros
    const tokenRaw = searchParams.get("token")
    const token = tokenRaw && tokenRaw.trim() !== "" ? tokenRaw : null

    const orderId = searchParams.get("orderId")?.trim() || null
    const action  = searchParams.get("action")?.trim()  || null

    // 1) Se veio token => JWT
    if (token) {
      const claims = await verifyActionToken(token)
      const nextStatus = mapActionToStatus(claims.action as OrderAction)
      if (!nextStatus) {
        return new NextResponse(HTML_ERR("Ação inválida."), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }

      const { data, error } = await admin()
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", claims.sub)
        .select("id, order_code, status")
        .single()

      if (error) {
        console.error("order-action update error (jwt):", error)
        return new NextResponse(HTML_ERR("Falha ao atualizar o pedido."), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }
      if (!data) {
        return new NextResponse(HTML_ERR("Pedido não encontrado."), {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }

      return new NextResponse(
        HTML_OK(`Pedido ${data.order_code ?? data.id} atualizado para "${data.status}".`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
      )
    }

    // 2) Se NÃO veio token mas vieram orderId+action => PLAIN
    if (orderId && action) {
      const nextStatus = mapActionToStatus(action)
      if (!nextStatus) {
        return new NextResponse(HTML_ERR("Ação inválida."), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }

      const { data, error } = await admin()
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", orderId)
        .select("id, order_code, status")
        .single()

      if (error) {
        console.error("order-action update error (plain):", error)
        return new NextResponse(HTML_ERR("Falha ao atualizar o pedido."), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }
      if (!data) {
        return new NextResponse(HTML_ERR("Pedido não encontrado."), {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        })
      }

      return new NextResponse(
        HTML_OK(`Pedido ${data.order_code ?? data.id} atualizado para "${data.status}".`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
      )
    }

    // 3) Nada útil veio
    return new NextResponse(HTML_ERR("Parâmetros ausentes."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  } catch (e: any) {
    console.error("GET /api/admin/order-action:", e)
    return new NextResponse(HTML_ERR(e?.message || "Erro inesperado."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
}
