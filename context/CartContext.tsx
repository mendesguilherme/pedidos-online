"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Cart, CartItem, Address } from "@/data/cart"
import type { Order } from "@/data/orders"
import { getOrCreateClientId } from "@/lib/client-id"

interface CartContextProps {
  cart: Cart
  updateCart: (updatedCart: Cart) => void
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  updateAddress: (address: Address) => void
  updatePaymentMethod: (method: string) => void
  updateTipo: (tipo: "entrega" | "retirada") => void
  itemCount: number
  clearCart: () => void
  saveOrder: () => Promise<void>
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

const round2 = (n: number) => Math.round(n * 100) / 100
const DEFAULT_DELIVERY_FEE = 0

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    deliveryAddress: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      zipCode: "",
      reference: "",
    },
    paymentMethod: "",
    tipo: null,
  })

  // Helper: aplica updater funcional + persiste
  const setCartAndPersist = (updater: (prev: Cart) => Cart) => {
    setCart(prev => {
      const next = updater(prev)
      try {
        localStorage.setItem("cart", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart")
      if (stored) setCart(JSON.parse(stored))
    } catch {}
  }, [])

  const updateCart = (updatedCart: Cart) => {
    setCartAndPersist(() => updatedCart)
  }

  const updateTipo = (tipo: "entrega" | "retirada") => {
    setCartAndPersist(prev => ({ ...prev, tipo }))
  }

  const addItem = (item: CartItem) => {
    setCartAndPersist(prev => ({
      ...prev,
      items: [...prev.items, item],
    }))
  }

  const removeItem = (id: number) => {
    setCartAndPersist(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }))
  }

  const updateQuantity = (id: number, quantity: number) => {
    setCartAndPersist(prev => {
      const items = prev.items
        .map(it => (it.id === id ? { ...it, quantity } : it))
        .filter(it => (it.quantity ?? 0) > 0)
      return { ...prev, items }
    })
  }

  const updateAddress = (address: Address) => {
    setCartAndPersist(prev => ({ ...prev, deliveryAddress: address }))
  }

  const updatePaymentMethod = (method: string) => {
    setCartAndPersist(prev => ({ ...prev, paymentMethod: method }))
  }

  const itemCount = cart.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

  const clearCart = () => {
    const emptyAddress = {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      zipCode: "",
      reference: "",
    }
    const emptyCart: Cart = {
      items: [],
      paymentMethod: "",
      deliveryAddress: emptyAddress,
      tipo: null,
    }
    setCartAndPersist(() => emptyCart)
  }

  const saveOrder = async () => {
    if (!cart.tipo) throw new Error("Tipo de pedido não definido.")
    if (cart.items.length === 0 || !cart.paymentMethod)
      throw new Error("Carrinho incompleto. Não é possível criar o pedido.")
    if (cart.tipo === "entrega" && (!cart.deliveryAddress || !cart.deliveryAddress.street))
      throw new Error("Endereço de entrega incompleto.")

    const subtotal = round2(
      cart.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity ?? 1), 0)
    )
    const frete = cart.tipo === "entrega" ? round2(DEFAULT_DELIVERY_FEE) : 0

    const payload = {
      cart: {
        ...cart,
        deliveryFee: frete,
        items: cart.items.map(it => ({ ...it, quantity: it.quantity ?? 1 })),
      },
      address:
        cart.tipo === "entrega"
          ? cart.deliveryAddress
          : { street: "", number: "", complement: "", neighborhood: "", city: "", zipCode: "", reference: "" },
      paymentMethod: cart.paymentMethod,
      tipo: cart.tipo,
      subtotal,
      frete,
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": getOrCreateClientId(),
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erro ao criar pedido")
    if (!data?.order) throw new Error("API não retornou o objeto do pedido.")

    const created = data.order
    const existingOrders: Order[] = JSON.parse(localStorage.getItem("orders") || "[]")

    const localOrder: Order = {
      id: created.order_code ?? created.id,
      createdAt: created.created_at ?? new Date().toISOString(),
      status: created.status ?? "pendente",
      tipo: created.tipo ?? cart.tipo!,
      items: cart.items,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      // @ts-ignore
      subtotal: created.subtotal ?? subtotal,
      // @ts-ignore
      frete: created.frete ?? frete,
      total: created.total ?? round2(subtotal + frete),
      // @ts-ignore
      dbId: created.id,
      // @ts-ignore
      orderCode: created.order_code,
    }

    localStorage.setItem("orders", JSON.stringify([...existingOrders, localOrder]))
    clearCart()
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        updateCart,
        addItem,
        removeItem,
        updateQuantity,
        updateAddress,
        updatePaymentMethod,
        updateTipo,
        itemCount,
        clearCart,
        saveOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
