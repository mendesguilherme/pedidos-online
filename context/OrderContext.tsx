"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Order } from "@/data/orders"
import { getSupabaseBrowser } from "@/lib/supabase/browser"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { getOrCreateClientId } from "@/lib/client-id"

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

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  // carrega do backend (Supabase via API) — ordena por ISO estável
  const loadFromApi = async () => {
    try {
      const clientId = getOrCreateClientId()
      const res = await fetch("/api/orders?limit=100", {
        cache: "no-store",
        headers: { "X-Client-Id": clientId }, // garante o filtro no server
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Falha ao carregar pedidos")

      // mapeia mantendo ISO para ordenar e string formatada para exibir
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

        return {
          id: row.order_code ?? row.id,
          createdAt: createdAtDisplay,
          status: row.status,
          tipo: row.tipo,
          items: (row.cart?.items ?? []).map((it: any) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity ?? 1,
            price: it.price ?? 0,
            toppings: it.toppings ?? [],
            extras: it.extras ?? [],
            image: it.image,
          })),
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
          total: Number(row.total ?? 0),
          __iso: createdAtIso,
        } satisfies OrderWithIso
      })

      // ordena pelo ISO (estável em todos browsers)
      mappedWithIso.sort(
        (a, b) => new Date(b.__iso).getTime() - new Date(a.__iso).getTime()
      )

      // remove o campo interno antes de setar
      const cleaned: Order[] = mappedWithIso.map(
        ({ __iso, ...rest }: OrderWithIso) => rest
      )

      setOrders(cleaned)
    } catch (e) {
      console.error("OrderContext: erro ao carregar pedidos:", e)
      // mantém a lista atual (não zera em erro transitório)
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
    // debounce para evitar storm de reloads
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleReload = () => {
      if (document.visibilityState === "hidden") return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadFromApi()
        debounceTimer = null
      }, 300)
    }

    // quando realtime DESLIGADO: polling adaptativo
    if (!ENABLE_REALTIME) {
      let stopped = false
      let interval = POLL_BASE_MS
      let timer: ReturnType<typeof setTimeout> | null = null

      const tick = async () => {
        if (stopped) return
        await loadFromApi()
        interval = Math.min(Math.floor(interval * 1.5), POLL_MAX_MS) // 5s -> 7.5s -> ... -> 30s
        timer = setTimeout(tick, interval)
      }

      timer = setTimeout(tick, interval)

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        if (timer) clearTimeout(timer)
        stopped = true
      }
    }

    // quando realtime LIGADO
    const sb = getSupabaseBrowser()
    if (!sb) return

    const clientId = getOrCreateClientId()

    // filtro por client_id para reduzir eventos desnecessários
    const channel = sb
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
      .subscribe((status: RealtimeChannel["state"]) => {
        // 'joined' | 'joining' | 'leaving' | 'closed' | 'errored'
        if (status !== "joined") {
          // fallback rápido caso WS não conecte
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
