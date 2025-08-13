// lib/admin-actions.ts
import { signActionToken, OrderAction } from "./admin-jwt"

function appBaseUrl() {
  const base = process.env.APP_BASE_URL
  if (!base) throw new Error("APP_BASE_URL não definido no .env.local")
  return base.replace(/\/+$/, "")
}

export async function buildActionLink(orderId: string, action: OrderAction) {
  const token = await signActionToken(orderId, action)
  const url = `${appBaseUrl()}/api/admin/order-action?token=${encodeURIComponent(token)}`
  return url
}

export async function buildAcceptDenyLinks(orderId: string) {
  const aceitar = await buildActionLink(orderId, "aceitar")
  const negar = await buildActionLink(orderId, "negar")
  return { aceitar, negar }
}

// Se quiser no futuro:
export async function buildProgressLinks(orderId: string) {
  const saiu = await buildActionLink(orderId, "saiu_para_entrega")
  const entregue = await buildActionLink(orderId, "entregue")
  return { saiu, entregue }
}
