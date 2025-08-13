// lib/admin-jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from "jose"

const enc = new TextEncoder()

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET não definido no .env.local")
  }
  return enc.encode(secret)
}

export type OrderAction =
  | "aceitar"        // -> em_preparo
  | "negar"          // -> cancelado
  | "saiu_para_entrega"
  | "entregue"

export interface ActionClaims extends JWTPayload {
  sub: string            // orderId (UUID do banco)
  action: OrderAction
  typ: "order_action"
}

export async function signActionToken(
  orderId: string,
  action: OrderAction,
  ttlSeconds = 15 * 60 // 15 minutos
) {
  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT({
    action,
    typ: "order_action",
  } as ActionClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(orderId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret())

  return token
}

export async function verifyActionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  })

  if (payload.typ !== "order_action") {
    throw new Error("Token inválido (typ incorreto)")
  }
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Token sem 'sub' (orderId)")
  }
  if (!payload.action || typeof payload.action !== "string") {
    throw new Error("Token sem 'action'")
  }

  return payload as ActionClaims
}
