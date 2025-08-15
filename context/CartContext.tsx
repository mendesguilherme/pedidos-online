"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Cart, CartItem, Address } from "@/data/cart"
import type { Order } from "@/data/orders"
import { generateUniqueOrderId } from "@/data/orders"
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
  itemCount: number, 
  clearCart: () => void, 
  saveOrder: () => Promise<void>
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

const round2 = (n:number) => Math.round(n*100)/100
const DEFAULT_DELIVERY_FEE = 0 // mantém seu fallback atual

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

  const updateTipo = (tipo: "entrega" | "retirada") => {
    updateCart({ ...cart, tipo })
  }

  useEffect(() => {
    const stored = localStorage.getItem("cart")
    if (stored) {
      setCart(JSON.parse(stored))
    }
  }, [])

  const updateCart = (updatedCart: Cart) => {
    setCart(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
  }

  const addItem = (item: CartItem) => {
    const updatedItems = [...cart.items, item]
    updateCart({ ...cart, items: updatedItems })
  }

  const removeItem = (id: number) => {
    const updatedItems = cart.items.filter((item) => item.id !== id)
    updateCart({ ...cart, items: updatedItems })
  }

  const updateQuantity = (id: number, quantity: number) => {
    const updatedItems = cart.items
      .map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
      .filter((item) => item.quantity > 0)

    updateCart({ ...cart, items: updatedItems })
  }

  const updateAddress = (address: Address) => {
    updateCart({ ...cart, deliveryAddress: address })
  }

  const updatePaymentMethod = (method: string) => {
    updateCart({ ...cart, paymentMethod: method })
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

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

    setCart(emptyCart)
    localStorage.setItem("cart", JSON.stringify(emptyCart))
}

  const saveOrder = async () => {
    if (!cart.tipo) throw new Error("Tipo de pedido não definido.")
    if (cart.items.length === 0 || !cart.paymentMethod)
      throw new Error("Carrinho incompleto. Não é possível criar o pedido.")
    if (cart.tipo === "entrega" && (!cart.deliveryAddress || !cart.deliveryAddress.street))
      throw new Error("Endereço de entrega incompleto.")

    // 🔹 subtotal = itens
    const subtotal = round2(
      cart.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity ?? 1), 0)
    )

    // 🔹 frete separado (0 em retirada)
    const frete = cart.tipo === "entrega" ? round2(DEFAULT_DELIVERY_FEE) : 0

    const payload = {
      // ✅ inclui deliveryFee no cart para o servidor reconhecer
      cart: {
        ...cart,
        deliveryFee: frete,
        items: cart.items.map(it => ({ ...it, quantity: it.quantity ?? 1 })),
      },
      address: cart.tipo === "entrega"
        ? cart.deliveryAddress
        : { street:"", number:"", complement:"", neighborhood:"", city:"", zipCode:"", reference:"" },
      paymentMethod: cart.paymentMethod,
      tipo: cart.tipo,
      // ✅ também envia campos explícitos (servidor prioriza, mas recalcula)
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

    // espelho local
    const existingOrders: Order[] = JSON.parse(localStorage.getItem("orders") || "[]")

    const localOrder: Order = {
      id: created.order_code ?? created.id,
      createdAt: created.created_at ?? new Date().toISOString(),
      status: created.status ?? "pendente",
      tipo: created.tipo ?? cart.tipo!,
      items: cart.items,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      // @ts-ignore: seu tipo Order local pode ainda não ter estes campos
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
        saveOrder
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
