// app/api/admin/order-action/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyActionToken, OrderAction } from "@/lib/admin-jwt"

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error("Supabase envs ausentes")
  return createClient(url, key)
}

function mapActionToStatus(action: OrderAction) {
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
  .btn{display:inline-block;margin-top:16px;padding:10px 14px;border-radius:10px;background:#111827;color:#fff;text-decoration:none}
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
    const token = searchParams.get("token")
    if (!token) {
      return new NextResponse(HTML_ERR("Token ausente."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      })
    }

    // 1) Valida token
    const claims = await verifyActionToken(token)
    const orderId = claims.sub
    const nextStatus = mapActionToStatus(claims.action as OrderAction)
    if (!nextStatus) {
      return new NextResponse(HTML_ERR("Ação inválida."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      })
    }

    // 2) Atualiza no banco
    const supa = admin()
    const { data, error } = await supa
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select("id, order_code, status")
      .single()

    if (error) {
      console.error("order-action update error:", error)
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

    // 3) Ok
    return new NextResponse(
      HTML_OK(`Pedido ${data.order_code ?? data.id} atualizado para "${data.status}".`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
    )
  } catch (e: any) {
    console.error("GET /api/admin/order-action:", e)
    return new NextResponse(HTML_ERR(e?.message || "Erro inesperado."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
}
