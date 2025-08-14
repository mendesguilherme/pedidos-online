// app/api/admin/order-action/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken, type OrderAction } from "@/lib/admin-jwt";
import { mapActionToStatus, canTransition, isOrderAction } from "@/lib/orders-workflow";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase envs ausentes");
  return createClient(url, key);
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
  if (r.startsWith("/")) return r;

  try {
    const base = new URL(process.env.APP_BASE_URL!);
    const target = new URL(r);
    if (target.host === base.host && target.protocol === base.protocol) {
      return target.toString();
    }
  } catch { /* ignore */ }
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

  const redirect = sanitizeRedirect(search.get("redirect"));
  if (redirect) {
    return NextResponse.redirect(redirect, { headers });
  }

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

  return new NextResponse(
    HTML_OK(`Pedido ${order.order_code ?? order.id} atualizado para "${order.status}".`),
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

/** Lê o motivo da negação (usa body JSON do POST se fornecido, ou query ?reason=). */
async function readReason(
  req: Request,
  search: URLSearchParams,
  bodyParsed?: any
): Promise<string | null> {
  let bodyReason = "";
  try {
    if (req.method === "POST") {
      // Evita ler o body duas vezes
      const body = bodyParsed ?? (await req.json().catch(() => null));
      bodyReason = String(body?.reason ?? "").trim();
    }
  } catch { /* ignore parse */ }

  const queryReason = String(search.get("reason") ?? "").trim();
  const reason = (bodyReason || queryReason).slice(0, 500);
  return reason ? reason : null;
}

/** Detecta erro por coluna inexistente (cancel_reason / canceled_at). */
function looksLikeMissingColumn(err: any) {
  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  return code === "42703" || /column .* (cancel_reason|canceled_at)/i.test(msg);
}

/** Atualiza o pedido aplicando status e, se for cancelamento, grava reason/canceled_at.
 *  Caso as colunas não existam, faz retry apenas com status (evita 500). */
async function updateOrderWithStatus(
  supa: ReturnType<typeof admin>,
  orderId: string,
  nextStatus: string,
  reason: string | null
) {
  const includeCancelFields = nextStatus === "cancelado";

  const update: Record<string, any> = { status: nextStatus };
  if (includeCancelFields) {
    update.canceled_at = new Date().toISOString();
    if (reason) update.cancel_reason = reason.slice(0, 500);
  }

  let { data, error } = await supa
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .select("id, order_code, status")
    .single();

  // Se deu erro por coluna inexistente, tenta novamente apenas com status
  if (error && includeCancelFields && looksLikeMissingColumn(error)) {
    console.warn("[order-action] cancel_reason/canceled_at inexistentes. Retentando sem esses campos.");
    ({ data, error } = await supa
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select("id, order_code, status")
      .single());
  }

  return { data, error };
}

// -------------------- GET --------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tokenRaw = searchParams.get("token");
    const token = tokenRaw && tokenRaw.trim() !== "" ? tokenRaw : null;

    const orderId = searchParams.get("orderId")?.trim() || null;
    const actionRaw = searchParams.get("action")?.trim() || null;

    // 1) Fluxo JWT
    if (token) {
      const claims = await verifyActionToken(token);
      const action = claims.action as OrderAction;
      const nextStatus = mapActionToStatus(action);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const supa = admin();

      const { data: current, error: readErr } = await supa
        .from("orders")
        .select("id, status, tipo, order_code")
        .eq("id", claims.sub)
        .single();

      if (readErr || !current) {
        return errResponse("Pedido não encontrado.", 404, searchParams);
      }

      if (!canTransition({ from: current.status, to: nextStatus, tipo: current.tipo })) {
        return errResponse(
          `Transição inválida de "${current.status}" para "${nextStatus}".`,
          400,
          searchParams
        );
      }

      const reason = await readReason(req, searchParams); // pode vir pela query no GET

      const { data, error } = await updateOrderWithStatus(supa, claims.sub, nextStatus, reason);
      if (error || !data) {
        console.error("order-action update error (jwt/get):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }

      return okResponse(data, searchParams);
    }

    // 2) Fluxo simples (orderId + action)
    if (orderId && actionRaw) {
      if (!isOrderAction(actionRaw)) {
        return errResponse("Ação inválida.", 400, searchParams);
      }
      const action = actionRaw as OrderAction;
      const nextStatus = mapActionToStatus(action);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const supa = admin();

      const { data: current, error: readErr } = await supa
        .from("orders")
        .select("id, status, tipo, order_code")
        .eq("id", orderId)
        .single();

      if (readErr || !current) {
        return errResponse("Pedido não encontrado.", 404, searchParams);
      }

      if (!canTransition({ from: current.status, to: nextStatus, tipo: current.tipo })) {
        return errResponse(
          `Transição inválida de "${current.status}" para "${nextStatus}".`,
          400,
          searchParams
        );
      }

      const reason = await readReason(req, searchParams);

      const { data, error } = await updateOrderWithStatus(supa, orderId, nextStatus, reason);
      if (error || !data) {
        console.error("order-action update error (plain/get):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }

      return okResponse(data, searchParams);
    }

    return errResponse("Parâmetros ausentes.", 400, searchParams);
  } catch (e: any) {
    console.error("GET /api/admin/order-action:", e);
    return errResponse(e?.message || "Erro inesperado.", 400);
  }
}

// -------------------- POST --------------------
// Aceita token OU (orderId + action) — e lê reason do body JSON (preferencial) ou da query.
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse do body (uma vez só) — pode trazer orderId, action e reason
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const tokenRaw = searchParams.get("token");
    const token = tokenRaw && tokenRaw.trim() !== "" ? tokenRaw : null;

    // orderId e action podem vir por query OU pelo corpo
    const orderId =
      (searchParams.get("orderId") ?? body?.orderId ?? "")
        .toString()
        .trim() || null;

    const actionRaw =
      (searchParams.get("action") ?? body?.action ?? "")
        .toString()
        .trim() || null;

    const reason = await readReason(req, searchParams, body); // usa o body já parseado

    // 1) Fluxo JWT
    if (token) {
      const claims = await verifyActionToken(token);
      const action = claims.action as OrderAction;
      const nextStatus = mapActionToStatus(action);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const supa = admin();

      const { data: current, error: readErr } = await supa
        .from("orders")
        .select("id, status, tipo, order_code")
        .eq("id", claims.sub)
        .single();

      if (readErr || !current) {
        return errResponse("Pedido não encontrado.", 404, searchParams);
      }

      if (!canTransition({ from: current.status, to: nextStatus, tipo: current.tipo })) {
        return errResponse(
          `Transição inválida de "${current.status}" para "${nextStatus}".`,
          400,
          searchParams
        );
      }

      const { data, error } = await updateOrderWithStatus(supa, claims.sub, nextStatus, reason);
      if (error || !data) {
        console.error("order-action update error (jwt/post):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }

      return okResponse(data, searchParams);
    }

    // 2) Fluxo simples (orderId + action)
    if (orderId && actionRaw) {
      if (!isOrderAction(actionRaw)) {
        return errResponse("Ação inválida.", 400, searchParams);
      }
      const action = actionRaw as OrderAction;
      const nextStatus = mapActionToStatus(action);
      if (!nextStatus) return errResponse("Ação inválida.", 400, searchParams);

      const supa = admin();

      const { data: current, error: readErr } = await supa
        .from("orders")
        .select("id, status, tipo, order_code")
        .eq("id", orderId)
        .single();

      if (readErr || !current) {
        return errResponse("Pedido não encontrado.", 404, searchParams);
      }

      if (!canTransition({ from: current.status, to: nextStatus, tipo: current.tipo })) {
        return errResponse(
          `Transição inválida de "${current.status}" para "${nextStatus}".`,
          400,
          searchParams
        );
      }

      const { data, error } = await updateOrderWithStatus(supa, orderId, nextStatus, reason);
      if (error || !data) {
        console.error("order-action update error (plain/post):", error);
        return errResponse("Falha ao atualizar o pedido.", 500, searchParams);
      }

      return okResponse(data, searchParams);
    }

    return errResponse("Parâmetros ausentes.", 400, searchParams);
  } catch (e: any) {
    console.error("POST /api/admin/order-action:", e);
    return errResponse(e?.message || "Erro inesperado.", 400);
  }
}
