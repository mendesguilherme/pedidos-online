"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft, Minus, Plus, Trash2, Home } from "lucide-react"
import { isRestaurantOpen } from "@/utils/business-hours"

export default function CarrinhoPage() {
  const router = useRouter()
  const { cart, removeItem, updateQuantity } = useCart()
  const cartItems = cart.items

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  const handleSeeProducts = () => {
    if (!isRestaurantOpen()) {
      // fechado → manda pra Home (lá já tem a validação/fluxo certo)
      router.push("/")
      return
    }
    // aberto → pode ir direto pros produtos
    router.push("/produtos")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <ShoppingCart className="w-5 h-5 mr-1 text-gray-600" />
              <h1 className="text-lg font-bold text-gray-800">Carrinho</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 text-xs rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu Principal</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-3 py-5 pb-20">
          {cartItems.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="text-center py-10 rounded-xl">
                <ShoppingCart className="w-14 h-14 mx-auto mb-3 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-600 mb-1">Carrinho vazio</h2>
                <p className="text-gray-500 mb-5">Adicione itens ao seu carrinho para continuar</p>
                <div className="space-y-2">
                  <Button
                    onClick={handleSeeProducts}
                    // opcional: já deixa visualmente desabilitado quando fechado
                    disabled={!isRestaurantOpen()}
                    className="w-full text-sm py-2 px-4 rounded-xl"
                  >
                    Ver Produtos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full text-sm py-2 px-4 rounded-xl"
                  >
                    Voltar ao Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>

          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <Card key={item.id} className="rounded-xl">
                  <CardContent className="p-3 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-600">
                          <strong>Acompanhamentos:</strong> {item.toppings?.join(", ") || "Nenhum"}
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Adicionais:</strong> {item.extras?.join(", ") || "Nenhum"}
                        </p>
                        <p className="text-green-600 font-bold text-sm mt-1">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 p-0 rounded-xl"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="font-semibold min-w-[1.5rem] text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 p-0 rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-1 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="rounded-xl">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {total.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button className="w-full text-sm py-2 rounded-xl" onClick={() => router.push("/produtos")}>
                      Continuar Comprando
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-sm py-2 rounded-xl"
                      onClick={() => router.push("/")}
                    >
                      Voltar ao Menu Principal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
