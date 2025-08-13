// app/api/admin/order-action/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken, type OrderAction } from "@/lib/admin-jwt";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase envs ausentes");
  return createClient(url, key);
}

function mapActionToStatus(action: OrderAction | string) {
  switch (action) {
    case "aceitar":
      return "em_preparo";
    case "negar":
      return "cancelado";
    case "saiu_para_entrega":
      return "saiu_para_entrega";
    case "entregue":
      return "entregue";
    default:
      return null;
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
</body></html>`;

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
</body></html>`;

/** Evita open-redirect. Aceita caminhos relativos (/admin) ou
 * URLs absolutas com o mesmo host do APP_BASE_URL. */
function sanitizeRedirect(raw?: string | null) {
  if (!raw) return null;
  const r = raw.trim();
  if (!r) return null;
  if (r.startsWith("/")) return r; // relativo no mesmo host

  try {
    const base = new URL(process.env.APP_BASE_URL!);
    const target = new URL(r);
    if (target.host === base.host && target.protocol === base.protocol) {
      return target.toString();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function wantsJson(search: URLSearchParams) {
  return (search.get("v") || "").toLowerCase() === "json";
}

function okResponse(
  order: { id: string; order_code?: string | null; status: string },
  search: URLSearchParams
) {
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
  };

  // 1) redirect tem prioridade
  const redirect = sanitizeRedirect(search.get("redirect"));
  if (redirect) {
    return NextResponse.redirect(redirect, { headers });
  }

  // 2) JSON se solicitado
  if (wantsJson(search)) {
    return NextResponse.json(
      {
        success: true,
        id: order.id,
        order_code: order.order_code ?? order.id,
        status: order.status,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 3) HTML (padrão, comportamento antigo)
  return new NextResponse(
    HTML_OK(
      `Pedido ${order.order_code ?? order.id} atualizado para "${order.status}".`
    ),
    { status: 200, headers }
  );
}

function errResponse(msg: string, status = 400, search?: URLSearchParams) {
  if (search && wantsJson(search)) {
    return NextResponse.json(
      { success: false, error: msg },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
  return new NextResponse(HTML_ERR(msg), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Normaliza parâmetros
    const tokenRaw = searchParams.get("token");
    const token = tokenRaw && tokenRaw.trim() !== "" ? tokenRaw : null;

    const orderId = searchParams.get("orderId")?.trim() || null;
    const action = searchParams.get("action")?.trim() || null;

    // 1) JWT
    if (token) {
      const claims = await verifyActionToken(token);
      const nextStatus = mapActionToStatus(claims.action as OrderAction);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const { data, error } = await admin()
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", claims.sub)
        .select("id, order_code, status")
        .single();

      if (error) {
        console.error("order-action update error (jwt):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }
      if (!data) return errResponse("Pedido não encontrado.", 404, searchParams);

      return okResponse(data, searchParams);
    }

    // 2) PLAIN (orderId + action)
    if (orderId && action) {
      const nextStatus = mapActionToStatus(action);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const { data, error } = await admin()
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", orderId)
        .select("id, order_code, status")
        .single();

      if (error) {
        console.error("order-action update error (plain):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }
      if (!data) return errResponse("Pedido não encontrado.", 404, searchParams);

      return okResponse(data, searchParams);
    }

    // 3) Nada útil veio
    return errResponse("Parâmetros ausentes.", 400, searchParams);
  } catch (e: any) {
    console.error("GET /api/admin/order-action:", e);
    return errResponse(e?.message || "Erro inesperado.", 400);
  }
}
