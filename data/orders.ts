// data/orders.ts

import type { CartItem, Address } from "./cart"

export type OrderStatus = "pendente" | "em preparo" | "saiu para entrega" | "entregue"

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  tipo: "entrega" | "retirada"
  items: CartItem[]
  address: Address
  paymentMethod: string
  total: number
}

/**
 * Gera um ID único para o pedido com prefixo "PED" e parte aleatória alfanumérica.
 * Garante que não há colisão com pedidos existentes.
 */
export function generateUniqueOrderId(existingIds: string[] = []): string {
  const prefix = "PED"
  let newId = ""

  do {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    newId = `${prefix}${randomPart}`
  } while (existingIds.includes(newId))

  return newId
}
