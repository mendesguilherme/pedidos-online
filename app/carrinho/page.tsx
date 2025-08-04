"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft, Minus, Plus, Trash2, Home } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function CarrinhoPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const mockItems: CartItem[] = [
      {
        id: 1,
        name: "Hambúrguer Clássico",
        price: 25.9,
        quantity: 2,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: 2,
        name: "Batata Frita",
        price: 12.9,
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
    ]
    setCartItems(mockItems)
  }, [])

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems((items) => items.filter((item) => item.id !== id))
    } else {
      setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-3">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <ShoppingCart className="w-6 h-6 mr-2 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">Carrinho</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu Principal</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 pb-20">
          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Carrinho vazio</h2>
                <p className="text-gray-500 mb-6">Adicione itens ao seu carrinho para continuar</p>
                <div className="space-y-3">
                  <Button onClick={() => router.push("/produtos")}>Ver Produtos</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Voltar ao Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-green-600 font-bold">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {total.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Button className="w-full" onClick={() => router.push("/produtos")}>
                      Continuar Comprando
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/")}>
                      Voltar ao Menu Principal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
