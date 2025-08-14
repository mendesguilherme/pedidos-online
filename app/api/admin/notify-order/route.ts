// app/api/admin/notify-order/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildActionLink } from "@/lib/admin-actions";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase envs ausentes");
  return createClient(url, key);
}

function sanitizeRedirect(raw?: string | null) {
  if (!raw) return null;
  const r = raw.trim();
  if (!r) return null;
  if (r.startsWith("/")) return r;
  try {
    const base = new URL(process.env.APP_BASE_URL!);
    const target = new URL(r);
    if (target.host === base.host && target.protocol === base.protocol) return target.toString();
  } catch {}
  return null;
}

async function postToN8n(payload: any) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) throw new Error("N8N_WEBHOOK_URL não configurado");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (token) headers["X-Webhook-Token"] = token;

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 3500);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[n8n] HTTP ${res.status} ${res.statusText} - ${txt}`);
    }
  } finally {
    clearTimeout(to);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();
    const redirectRaw = searchParams.get("redirect");
    const redirect = sanitizeRedirect(redirectRaw) || "/admin";
    const mode = (searchParams.get("v") || "html").toLowerCase(); // json|html

    if (!id) {
      const m = { success: false, error: "Parâmetro id ausente." };
      return mode === "json"
        ? NextResponse.json(m, { status: 400 })
        : NextResponse.redirect(redirect);
    }

    const supa = admin();
    const { data: order, error } = await supa
      .from("orders")
      .select(`
        id, order_code, created_at, status, tipo, total, payment_method, cart, address, client_id
      `)
      .eq("id", id)
      .single();

    if (error || !order) {
      const m = { success: false, error: "Pedido não encontrado." };
      return mode === "json"
        ? NextResponse.json(m, { status: 404 })
        : NextResponse.redirect(redirect);
    }

    // gera links úteis p/ mensagem do WhatsApp (com redirect de volta ao /admin)
    const base = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
    const back = `${base}/admin`;
    const aceitar   = await buildActionLink(order.id, "aceitar", { redirect: back, v: "html" });
    const negar     = await buildActionLink(order.id, "negar",   { redirect: back, v: "html" });
    const saiu      = await buildActionLink(order.id, "saiu_para_entrega", { redirect: back, v: "html" });
    const entregue  = await buildActionLink(order.id, "entregue", { redirect: back, v: "html" });

    // dispara n8n (fire-and-forget)
    postToN8n({
      source: "admin_notify",
      sentAt: new Date().toISOString(),
      order,
      actionLinks: { aceitar, negar, saiu, entregue },
      executionMode: "admin",
    }).catch(() => {});

    // volta ao /admin (ou responde JSON)
    if (mode === "json") {
      return NextResponse.json({ success: true, id: order.id });
    }
    return NextResponse.redirect(redirect);
  } catch (e: any) {
    console.error("GET /api/admin/notify-order:", e);
    return NextResponse.json({ success: false, error: e?.message || "Erro" }, { status: 500 });
  }
}
