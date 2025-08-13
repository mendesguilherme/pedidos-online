// lib/admin-actions.ts
import { signActionToken, OrderAction } from "./admin-jwt";

function baseUrl() {
  const v = process.env.APP_BASE_URL;
  if (!v) throw new Error("APP_BASE_URL não definido");
  return v.replace(/\/+$/, "");
}

function linkMode(): "plain" | "jwt" {
  const v = (process.env.ADMIN_ACTION_LINK_MODE || "plain").toLowerCase();
  return v === "jwt" ? "jwt" : "plain";
}

export async function buildActionLink(orderId: string, action: string) {
  const mode = linkMode();
  const a = String(action).toLowerCase() as OrderAction;

  if (mode === "jwt") {
    const token = await signActionToken(orderId, a);
    return `${baseUrl()}/api/admin/order-action?token=${encodeURIComponent(token)}`;
  }

  // plain
  return `${baseUrl()}/api/admin/order-action?orderId=${encodeURIComponent(orderId)}&action=${encodeURIComponent(a)}`;
}

export async function buildAcceptDenyLinks(orderId: string) {
  return {
    aceitar: await buildActionLink(orderId, "aceitar"),
    negar: await buildActionLink(orderId, "negar"),
  };
}

export async function buildProgressLinks(orderId: string) {
  return {
    saiu: await buildActionLink(orderId, "saiu_para_entrega"),
    entregue: await buildActionLink(orderId, "entregue"),
  };
}
