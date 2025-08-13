// lib/admin-actions.ts
import { signActionToken, OrderAction } from "./admin-jwt";

type BuildOpts = {
  /** URL para redirecionar depois da ação, ex: https://seuapp.com/admin */
  redirect?: string;
  /** Formato de resposta desejado pelo endpoint: "html" (padrão) ou "json" */
  v?: "html" | "json";
};

function baseUrl() {
  const v = process.env.APP_BASE_URL;
  if (!v) throw new Error("APP_BASE_URL não definido");
  return v.replace(/\/+$/, "");
}

function linkMode(): "plain" | "jwt" {
  const v = (process.env.ADMIN_ACTION_LINK_MODE || "plain").toLowerCase();
  return v === "jwt" ? "jwt" : "plain";
}

/**
 * Gera link de ação.
 * Uso antigo continua funcionando:
 *   buildActionLink(orderId, "aceitar")
 * Novo (opcional):
 *   buildActionLink(orderId, "aceitar", { redirect: "https://app/admin", v: "html" })
 */
export async function buildActionLink(orderId: string, action: string, opts: BuildOpts = {}) {
  const mode = linkMode();
  const a = String(action).toLowerCase() as OrderAction;

  const qp: string[] = [];

  if (mode === "jwt") {
    const token = await signActionToken(orderId, a);
    qp.push(`token=${encodeURIComponent(token)}`);
  } else {
    qp.push(`orderId=${encodeURIComponent(orderId)}`);
    qp.push(`action=${encodeURIComponent(a)}`);
  }

  if (opts.redirect) qp.push(`redirect=${encodeURIComponent(opts.redirect)}`);
  if (opts.v)        qp.push(`v=${encodeURIComponent(opts.v)}`);

  return `${baseUrl()}/api/admin/order-action?${qp.join("&")}`;
}

export async function buildAcceptDenyLinks(orderId: string, opts?: BuildOpts) {
  return {
    aceitar: await buildActionLink(orderId, "aceitar", opts),
    negar:   await buildActionLink(orderId, "negar",   opts),
  };
}

export async function buildProgressLinks(orderId: string, opts?: BuildOpts) {
  return {
    saiu:     await buildActionLink(orderId, "saiu_para_entrega", opts),
    entregue: await buildActionLink(orderId, "entregue",          opts),
  };
}
