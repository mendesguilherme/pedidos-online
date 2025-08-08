"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Order } from "@/data/orders"
import { getSupabaseBrowser } from "@/lib/supabase/browser"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface OrderContextProps {
  orders: Order[]
  orderCount: number
  refreshOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined)

type OrderWithIso = Order & { __iso: string }

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  // carrega do backend (Supabase via API) — ordena por ISO estável
  const loadFromApi = async () => {
    try {
      const res = await fetch("/api/orders?limit=100", { cache: "no-store" })
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

  // 🔴 Realtime com debounce (coalescing de eventos)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const scheduleReload = () => {
      if (document.visibilityState === "hidden") return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadFromApi()
        debounceTimer = null
      }, 300)
    }

    const sb = getSupabaseBrowser()
    if (!sb) return

    const channel = sb
    .channel("orders-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      (payload: RealtimePostgresChangesPayload<any>) => {
        // console.log("[RT] evento:", payload.eventType)
        scheduleReload()
      }
    )
    .subscribe((status: RealtimeChannel["state"]) => {
      // status: 'joined' | 'joining' | 'leaving' | 'closed' | 'errored'
      if (status !== "joined") {
        if (!pollTimer) {
          pollTimer = setInterval(() => {
            if (document.visibilityState === "visible") loadFromApi()
          }, 10000)
        }
      } else {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
      }
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      if (pollTimer) clearInterval(pollTimer)
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
