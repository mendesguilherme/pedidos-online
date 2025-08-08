"use client"

import { useEffect, useState } from "react"

type DbOrder = {
  id: string
  order_code: string
  created_at: string
  status: "pendente" | "em preparo" | "saiu para entrega" | "entregue"
  tipo: "entrega" | "retirada"
  total: number
  payment_method?: string   // 👈 ADD
  cart: any
  address: any
}

export function useOrders(limit = 50) {
  const [orders, setOrders] = useState<DbOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?limit=${limit}`, { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Falha ao carregar pedidos")
      setOrders(json.orders || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [limit])

  // Opcional: polling leve a cada 10s (até você ativar realtime)
  useEffect(() => {
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  return { orders, loading, error, reload: load }
}
