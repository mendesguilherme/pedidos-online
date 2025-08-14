import type { CartItem, Address, Cart } from "./cart"

export type OrderStatus = "pendente" | "em preparo" | "saiu para entrega" | "entregue"

// helper interno para evitar erro de ponto flutuante
const round2 = (n: number) => Math.round(n * 100) / 100

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  tipo: "entrega" | "retirada" | null
  items: CartItem[]
  address?: Address | null
  paymentMethod: string

  // 🔽 novos campos
  subtotal: number   // soma de items[].price * quantity
  frete: number      // 0 quando tipo = "retirada"
  total: number      // subtotal + frete
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

/** Soma prices do carrinho (considera quantity) */
export function calcSubtotal(items: CartItem[]): number {
  const sum = (items ?? []).reduce((acc, it) => {
    const price = Number(it?.price ?? 0)
    const qty = Number(it?.quantity ?? 0)
    return acc + price * qty
  }, 0)
  return round2(sum)
}

/** Monta um Order a partir do Cart já preenchido */
export function buildOrderFromCart(
  cart: Cart,
  opts: { frete?: number; status?: OrderStatus; existingIds?: string[] } = {}
): Order {
  const subtotal = calcSubtotal(cart.items)
  const frete = cart.tipo === "entrega" ? Number(opts.frete ?? 0) : 0
  const total = round2(subtotal + frete)

  return {
    id: generateUniqueOrderId(opts.existingIds ?? []),
    createdAt: new Date().toISOString(),
    status: opts.status ?? "pendente",
    tipo: cart.tipo,
    items: cart.items,
    address: cart.deliveryAddress,
    paymentMethod: cart.paymentMethod,
    subtotal: round2(subtotal),
    frete: round2(frete),
    total,
  }
}
