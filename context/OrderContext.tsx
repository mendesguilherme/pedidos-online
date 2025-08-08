"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Order } from "@/data/orders"
import { supabaseBrowser } from "@/lib/supabase/browser"

interface OrderContextProps {
  orders: Order[]
  orderCount: number
  refreshOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined)

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  // carrega do backend (Supabase via API) — agora ordena por ISO estável
  const loadFromApi = async () => {
    try {
      const res = await fetch("/api/orders?limit=100", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Falha ao carregar pedidos")

      // mapeia mantendo ISO para ordenar e string formatada para exibir
      const mappedWithIso = (json.orders ?? []).map((row: any) => {
        const createdAtIso: string = row.created_at
        const createdAtDisplay = new Date(createdAtIso).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        })

        const o: Order & { __iso?: string } = {
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
          // campo interno para ordenar
          __iso: createdAtIso,
        }
        return o
      })

      // ordena pelo ISO (estável em todos browsers)
      mappedWithIso.sort(
        (a: any, b: any) =>
          new Date(b.__iso!).getTime() - new Date(a.__iso!).getTime()
      )

      // remove o campo interno antes de setar
      const cleaned: Order[] = mappedWithIso.map(({ __iso, ...rest }) => rest as Order)

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

    const scheduleReload = () => {
      if (document.visibilityState === "hidden") return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadFromApi()
        debounceTimer = null
      }, 300)
    }

    const channel = supabaseBrowser
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        scheduleReload
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabaseBrowser.removeChannel(channel)
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
