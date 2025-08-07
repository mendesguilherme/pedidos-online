"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle,
  Truck,
  ShoppingBag,
  Home,
} from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"

interface Order {
  id: string
  date: string
  status: "preparing" | "ready" | "delivered" | "cancelled"
  type: "entrega" | "retirada"
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
}

export default function PedidosPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: "PED001",
        date: "2024-01-15 14:30",
        status: "delivered",
        type: "entrega",
        items: [
          { name: "Hambúrguer Clássico", quantity: 2, price: 25.9 },
          { name: "Batata Frita", quantity: 1, price: 12.9 },
        ],
        total: 64.7,
      },
      {
        id: "PED002",
        date: "2024-01-14 19:15",
        status: "preparing",
        type: "retirada",
        items: [{ name: "Pizza Margherita", quantity: 1, price: 32.9 }],
        total: 32.9,
      },
    ]
    setOrders(mockOrders)
  }, [])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "preparing":
        return { label: "Preparando", color: "bg-yellow-500", icon: Clock }
      case "ready":
        return { label: "Pronto", color: "bg-blue-500", icon: CheckCircle }
      case "delivered":
        return { label: "Entregue", color: "bg-green-500", icon: CheckCircle }
      case "cancelled":
        return { label: "Cancelado", color: "bg-red-500", icon: CheckCircle }
      default:
        return { label: "Desconhecido", color: "bg-gray-500", icon: Clock }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              <h1 className="text-base font-semibold text-gray-800">Meus Pedidos</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 pb-20">
          {orders.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="text-center py-10 rounded-xl">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-600 mb-2">
                  Nenhum pedido encontrado
                </h2>
                <p className="text-gray-500 mb-5">Você ainda não fez nenhum pedido</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/produtos")}
                    className="rounded-xl w-full"
                  >
                    Fazer Primeiro Pedido
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="rounded-xl w-full"
                  >
                    Voltar ao Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                const StatusIcon = statusInfo.icon

                return (
                  <Card key={order.id} className="rounded-xl">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            Pedido #{order.id}
                          </CardTitle>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge
                            className={`${statusInfo.color} text-white text-[10px] py-1 px-2 rounded-xl`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <div className="flex items-center text-xs text-gray-600">
                            {order.type === "entrega" ? (
                              <>
                                <Truck className="w-3 h-3 mr-1" /> Entrega
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3 h-3 mr-1" /> Retirada
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="rounded-xl">
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-xs text-gray-700"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>
                              R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                        <span>Total:</span>
                        <span className="text-green-600">
                          R$ {order.total.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Botão para novo pedido */}
              <div className="pt-4">
                <Button className="w-full rounded-xl text-sm py-2" onClick={() => router.push("/")}>
                  <Home className="w-4 h-4 mr-2" />
                  Fazer Novo Pedido
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
