// lib/admin-actions.ts
// Marque este módulo como "server-only" para não vazar a Service Role Key para o cliente:
import "server-only"

import { signActionToken, OrderAction } from "./admin-jwt"
import bcrypt from "bcrypt"

/* =========================
 * PARTE 1 — LINKS DE AÇÃO (o que você já tinha)
 * ========================= */

type BuildOpts = {
  /** URL para redirecionar depois da ação, ex: https://seuapp.com/admin */
  redirect?: string
  /** Formato de resposta desejado pelo endpoint: "html" (padrão) ou "json" */
  v?: "html" | "json"
}

function baseUrl() {
  const v = process.env.APP_BASE_URL
  if (!v) throw new Error("APP_BASE_URL não definido")
  return v.replace(/\/+$/, "")
}

function linkMode(): "plain" | "jwt" {
  const v = (process.env.ADMIN_ACTION_LINK_MODE || "plain").toLowerCase()
  return v === "jwt" ? "jwt" : "plain"
}

/** Gera link de ação (aceitar/negar/saiu/entregue) */
export async function buildActionLink(orderId: string, action: string, opts: BuildOpts = {}) {
  const mode = linkMode()
  const a = String(action).toLowerCase() as OrderAction

  const qp: string[] = []
  if (mode === "jwt") {
    const token = await signActionToken(orderId, a)
    qp.push(`token=${encodeURIComponent(token)}`)
  } else {
    qp.push(`orderId=${encodeURIComponent(orderId)}`)
    qp.push(`action=${encodeURIComponent(a)}`)
  }

  if (opts.redirect) qp.push(`redirect=${encodeURIComponent(opts.redirect)}`)
  if (opts.v) qp.push(`v=${encodeURIComponent(opts.v)}`)

  return `${baseUrl()}/api/admin/order-action?${qp.join("&")}`
}

export async function buildAcceptDenyLinks(orderId: string, opts?: BuildOpts) {
  return {
    aceitar: await buildActionLink(orderId, "aceitar", opts),
    negar: await buildActionLink(orderId, "negar", opts),
  }
}

export async function buildProgressLinks(orderId: string, opts?: BuildOpts) {
  return {
    saiu: await buildActionLink(orderId, "saiu_para_entrega", opts),
    entregue: await buildActionLink(orderId, "entregue", opts),
  }
}

/* =========================
 * PARTE 2 — AUTENTICAÇÃO DO ADMIN (Supabase REST + bcrypt)
 * ========================= */

export type AdminRow = {
  id: string
  username: string
  name: string | null
  password_hash: string
  is_active: boolean
}

function supabaseBase() {
  const v =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL não definido");
  return v.replace(/\/+$/, "");
}
function serviceKey() {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!v) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida")
  return v
}

/** Busca o admin por username via PostgREST (server-only). */
export async function getAdminByUsername(username: string): Promise<AdminRow | null> {
  const base = supabaseBase()
  const key = serviceKey()
  const url = `${base}/rest/v1/admins?username=eq.${encodeURIComponent(
    username
  )}&select=id,username,name,password_hash,is_active&limit=1`

  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) return null
  const data = (await res.json()) as AdminRow[]
  return data?.[0] ?? null
}

/**
 * Verifica as credenciais do admin:
 * - retorna { id, name, username } se ok
 * - retorna null se inválido/inativo
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<{ id: string; name: string; username: string } | null> {
  const admin = await getAdminByUsername(username)
  if (!admin || !admin.is_active) return null

  const ok = await bcrypt.compare(password, admin.password_hash)
  if (!ok) return null

  return { id: admin.id, name: admin.name ?? "Admin", username: admin.username }
}

/**
 * (Opcional) Atualiza a senha do admin gerando um novo hash bcrypt no servidor
 * — útil para tela "trocar senha".
 */
export async function updateAdminPassword(username: string, newPassword: string) {
  const base = supabaseBase()
  const key = serviceKey()
  const newHash = await bcrypt.hash(newPassword, 12)

  const res = await fetch(
    `${base}/rest/v1/admins?username=eq.${encodeURIComponent(username)}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ password_hash: newHash }),
    }
  )

  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Falha ao atualizar senha: ${res.status} ${t}`)
  }

  const data = (await res.json()) as AdminRow[]
  return data?.[0]
}
