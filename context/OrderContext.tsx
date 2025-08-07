"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Order } from "@/data/orders"

interface OrderContextProps {
  orders: Order[]
  orderCount: number
  refreshOrders: () => void
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined)

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  const loadOrders = () => {
    const storedOrders = localStorage.getItem("orders")
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders))
    } else {
      setOrders([])
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const refreshOrders = () => {
    loadOrders()
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
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}
