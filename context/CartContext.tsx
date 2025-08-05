"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Cart, CartItem } from "@/data/cart"

interface CartContextProps {
  cart: Cart
  updateCart: (updatedCart: Cart) => void
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  itemCount: number
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    deliveryAddress: null,
    paymentMethod: "",
    tipo: "entrega",
  })

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
    const updatedItems = cart.items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ).filter((item) => item.quantity > 0)

    updateCart({ ...cart, items: updatedItems })
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ cart, updateCart, addItem, removeItem, updateQuantity, itemCount }}
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
