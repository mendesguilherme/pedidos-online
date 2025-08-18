"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Order as BaseOrder } from "@/data/orders"
import { getSupabaseBrowser } from "@/lib/supabase/browser"
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_SUBSCRIBE_STATES
} from "@supabase/supabase-js"
import { getOrCreateClientId } from "@/lib/client-id"

/** Itens do pedido expostos no contexto (inclui `cremes`) */
type OrderItem = {
  id: number
  name: string
  quantity: number
  price: number
  toppings: string[]
  cremes: string[]
  extras: string[]
  image?: string
}

/** Order do contexto: sobrescreve `items` do BaseOrder para aceitar `cremes` */
type Order = Omit<BaseOrder, "items"> & {
  items: OrderItem[]
  subtotal: number
  frete: number
  total: number
  /** campos para cancelamento/motivo (expostos para a página) */
  cancel_reason?: string | null
  denied_reason?: string | null
  canceled_at?: string | null
}

interface OrderContextProps {
  orders: Order[]
  orderCount: number
  refreshOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined)

type OrderWithIso = Order & { __iso: string }

// 🔧 feature flag para Realtime
const ENABLE_REALTIME = process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true"
// polling adaptativo (quando Realtime desligado ou indisponível)
const POLL_BASE_MS = 5000
const POLL_MAX_MS = 30000

const round2 = (n: number) => Math.round(n * 100) / 100

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  // carrega do backend (Supabase via API) — ordena por ISO estável
  const loadFromApi = async () => {
    try {
      const clientId = getOrCreateClientId()
      const res = await fetch("/api/orders?limit=100", {
        cache: "no-store",
        headers: { "X-Client-Id": clientId },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Falha ao carregar pedidos")

      const mappedWithIso: OrderWithIso[] = (json.orders ?? []).map((row: any) => {
        const createdAtIso: string = row.created_at
        const createdAtDisplay = new Date(createdAtIso).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        })

        // fallbacks para pedidos antigos
        const itemsRaw = (row.cart?.items ?? []) as Array<{ price: number; quantity: number }>
        const computedSubtotal = round2(
          itemsRaw.reduce((s, it) => s + Number(it?.price || 0) * Number(it?.quantity ?? 1), 0)
        )

        const tipo = row.tipo
        const subtotal = round2(Number(row.subtotal ?? computedSubtotal))
        const frete = round2(
          Number(
            tipo === "entrega"
              ? (row.frete ?? row.delivery_fee ?? row.cart?.deliveryFee ?? 0)
              : 0
          )
        )
        const total = round2(Number(row.total ?? (subtotal + frete)))

        const items: OrderItem[] = (row.cart?.items ?? []).map((it: any) => ({
          id: it.id,
          name: String(it.name),
          quantity: Number(it.quantity ?? 1),
          price: Number(it.price ?? 0),
          toppings: Array.isArray(it.toppings) ? it.toppings : [],
          cremes: Array.isArray(it.cremes) ? it.cremes : [], // ⬅️ AQUI: inclui cremes
          extras: Array.isArray(it.extras) ? it.extras : [],
          image: it.image,
        }))

        return {
          id: row.order_code ?? row.id,
          createdAt: createdAtDisplay,
          status: row.status,
          tipo,
          items,
          address:
            row.address ??
            row.cart?.deliveryAddress ?? {
              street: "",
              number: "",
              complement: "",
              neighborhood: "",
              city: "",
              zipCode: "",
              reference: "",
            },
          paymentMethod: row.payment_method ?? row.cart?.paymentMethod ?? "",
          subtotal,   // vem do DB/fallback
          frete,      // vem do DB/fallback
          total,      // consistente com subtotal+frete
          // repassa campos de cancelamento/motivo
          cancel_reason: row.cancel_reason ?? null,
          denied_reason: row.denied_reason ?? null,
          canceled_at: row.canceled_at ?? null,
          __iso: createdAtIso,
        } as OrderWithIso
      })

      mappedWithIso.sort(
        (a, b) => new Date(b.__iso).getTime() - new Date(a.__iso).getTime()
      )

      const cleaned: Order[] = mappedWithIso.map(({ __iso, ...rest }) => rest)
      setOrders(cleaned)
    } catch (e) {
      console.error("OrderContext: erro ao carregar pedidos:", e)
    }
  }

  // primeiro load + listeners de foco/online
  useEffect(() => {
    loadFromApi()

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadFromApi()
      }
    }
    const onOnline = () => loadFromApi()

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  // Realtime OU Polling adaptativo (controlado por flag)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleReload = () => {
      if (document.visibilityState === "hidden") return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadFromApi()
        debounceTimer = null
      }, 300)
    }

    if (!ENABLE_REALTIME) {
      let stopped = false
      let interval = POLL_BASE_MS
      let timer: ReturnType<typeof setTimeout> | null = null

      const tick = async () => {
        if (stopped) return
        await loadFromApi()
        interval = Math.min(Math.floor(interval * 1.5), POLL_MAX_MS)
        timer = setTimeout(tick, interval)
      }

      timer = setTimeout(tick, interval)

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        if (timer) clearTimeout(timer)
        stopped = true
      }
    }

    const sb = getSupabaseBrowser()
    if (!sb) return

    const clientId = getOrCreateClientId()

    const channel: RealtimeChannel = sb
      .channel(`orders-realtime-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `client_id=eq.${clientId}`,
        },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          scheduleReload()
        }
      )
      .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
        // status: "SUBSCRIBED" | "TIMED_OUT" | "CHANNEL_ERROR" | "CLOSED"
        if (status !== "SUBSCRIBED") {
          setTimeout(() => loadFromApi(), 1000)
        }
      })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      sb.removeChannel(channel)
    }
  }, [])

  const refreshOrders = async () => {
    await loadFromApi()
  }

  const orderCount = orders.length

  return (
    <OrderContext.Provider value={{ orders, orderCount, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) throw new Error("useOrders must be used within an OrderProvider")
  return context
}
