"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Cart, CartItem, Address } from "@/data/cart"
import type { Order } from "@/data/orders"
import { generateUniqueOrderId } from "@/data/orders"

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
  saveOrder: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

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

  const saveOrder = () => {
    // 1. Validação: tipo precisa estar definido
    if (!cart.tipo) {
      throw new Error("Tipo de pedido não definido.")
    }

    // 2. Validação: precisa ter itens e forma de pagamento
    if (cart.items.length === 0 || !cart.paymentMethod) {
      throw new Error("Carrinho incompleto. Não é possível criar o pedido.")
    }

    // 3. Só valida endereço se for entrega
    if (
      cart.tipo === "entrega" &&
      (!cart.deliveryAddress || !cart.deliveryAddress.street)
    ) {
      throw new Error("Endereço de entrega incompleto.")
    }

    // 4. Buscar pedidos existentes
    const existingOrders: Order[] = JSON.parse(localStorage.getItem("orders") || "[]")
    const existingIds = existingOrders.map((order) => order.id)

    // 5. Criar novo pedido
    const newOrder: Order = {
      id: generateUniqueOrderId(existingIds),
      createdAt: new Date().toISOString(),
      status: "pendente",
      tipo: cart.tipo,
      items: cart.items,
      address:
        cart.tipo === "entrega"
          ? cart.deliveryAddress
          : {
              street: "",
              number: "",
              complement: "",
              neighborhood: "",
              city: "",
              zipCode: "",
              reference: "",
            },
      paymentMethod: cart.paymentMethod,
      total:
        cart.items.reduce((sum, item) => sum + item.price, 0) +
        (cart.tipo === "entrega" ? 5 : 0),
    }

    // 6. Salvar no localStorage
    const updatedOrders = [...existingOrders, newOrder]
    localStorage.setItem("orders", JSON.stringify(updatedOrders))
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
