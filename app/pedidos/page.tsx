"use client"

export const dynamic = "force-dynamic"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle,
  Truck,
  ShoppingBag,
  Home,
} from "lucide-react"
import { useOrders as useOrdersContext } from "@/context/OrderContext"

const round2 = (n: number) => Math.round(n * 100) / 100
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

interface Order {
  id: string
  date: string
  status: "pendente" | "em preparo" | "saiu para entrega" | "entregue" | "cancelado"
  type: "entrega" | "retirada"
  items: Array<{
    name: string
    quantity: number
    price: number
    toppings?: string[]
    extras?: string[]
  }>
  subtotal: number
  frete: number
  total: number
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    zipCode: string
    reference?: string
  }
  paymentMethod: string
  /** Motivo do cancelamento (quando status=cancelado) */
  deniedReason?: string
}

function dbStatusToUi(status: string): Order["status"] {
  const map: Record<string, Order["status"]> = {
    pendente: "pendente",
    em_preparo: "em preparo",
    saiu_para_entrega: "saiu para entrega",
    entregue: "entregue",
    cancelado: "cancelado",
  }
  return (map[status] ?? (status.replaceAll("_", " ") as Order["status"]))
}

export default function PedidosPage() {
  const router = useRouter()
  const { orders: ctxOrders } = useOrdersContext()
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id))
  }

  // 🔁 Mapeia do contexto (fonte única) para o shape desta página
  const orders: Order[] = useMemo(() => {
    return (ctxOrders ?? []).map((o: any) => {
      const items: Order["items"] = (o.items ?? []).map((it: any) => ({
        name: String(it?.name ?? ""),
        quantity: Number(it?.quantity ?? 1),
        price: Number(it?.price ?? 0),
        toppings: Array.isArray(it?.toppings) ? it.toppings : [],
        extras: Array.isArray(it?.extras) ? it.extras : [],
      }))

      const computedSubtotal = round2(
        items.reduce((s: number, it) => s + it.price * it.quantity, 0)
      )

      const rawSubtotal = Number(
        o.subtotal != null ? o.subtotal : computedSubtotal
      )

      const isEntrega =
        (o.tipo ?? o.type)?.toString().toLowerCase() === "entrega"

      const possibleFrete =
        o.frete ??
        o.delivery_fee ??
        o.deliveryFee ??
        o.cart?.deliveryFee

      const rawFrete = isEntrega ? Number(possibleFrete ?? 0) : 0

      const subtotal = round2(rawSubtotal)
      const frete = round2(Math.max(0, rawFrete))
      const total = round2(
        Number(o.total != null ? o.total : subtotal + frete)
      )

      const deniedReason = String(
        o.cancel_reason ??
          o.denied_reason ??
          o.deny_reason ??
          o.rejection_reason ??
          o.reason ??
          o.motivo ??
          ""
      ).trim()

      return {
        id: String(o.id),
        date: o.createdAt ?? o.created_at ?? "",
        status: dbStatusToUi(String(o.status ?? "")),
        type: (o.tipo ?? o.type) as Order["type"],
        items,
        subtotal,
        frete,
        total,
        address: o.address,
        paymentMethod: o.paymentMethod ?? o.payment_method ?? "",
        deniedReason,
      }
    })
  }, [ctxOrders])

  function getPaymentInfo(method: string): string {
    switch ((method || "").toLowerCase()) {
      case "pix":
        return "PIX"
      case "card":
      case "credit":
      case "debit":
        return "Cartão"
      case "cash":
      case "money":
        return "Dinheiro"
      default:
        return "Outro"
    }
  }

  // ⬇️ ALTERADO: recebe também o tipo para ajustar o label quando for retirada
  const getStatusInfo = (status: string, type?: Order["type"]) => {
    // quando o status do banco for "saiu_para_entrega" e o pedido for retirada,
    // mostramos "Pronto para retirada" só na UI (sem mudar nada no banco)
    if (status === "saiu para entrega" && type === "retirada") {
      return { label: "Pronto para retirada", color: "bg-purple-500", icon: ShoppingBag }
    }

    switch (status) {
      case "pendente":
        return { label: "Pendente", color: "bg-yellow-500", icon: Clock }
      case "em preparo":
        return { label: "Em preparo", color: "bg-blue-500", icon: Clock }
      case "saiu para entrega":
        return { label: "Saiu para entrega", color: "bg-purple-500", icon: Truck }
      case "entregue":
        return { label: "Entregue", color: "bg-green-500", icon: CheckCircle }
      case "cancelado":
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
                // ⬇️ passa também o tipo
                const statusInfo = getStatusInfo(order.status, order.type)
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
                            <span>{fmtBRL(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal, Frete e Total (mantendo posição) */}
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Subtotal:</span>
                          <span>{fmtBRL(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Frete:</span>
                          <span>{fmtBRL(order.frete)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Total:</span>
                          <span className="text-green-600">
                            {fmtBRL(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* 🔴 Motivo do cancelamento — somente quando cancelado */}
                      {order.status === "cancelado" && order.deniedReason && (
                        <div className="mt-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          <span className="font-semibold">Motivo do cancelamento:</span>
                          <p className="mt-1 whitespace-pre-wrap">{order.deniedReason}</p>
                        </div>
                      )}

                      {expandedOrderId === order.id && (
                        <div className="mt-3 space-y-3 text-xs text-gray-700 border-t pt-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="font-semibold">
                                {item.quantity}x {item.name}
                              </p>

                              {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                                <div className="pl-2">
                                  <span className="font-semibold">Acompanhamentos:</span>
                                  <ul className="list-disc list-inside">
                                    {item.toppings.map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {Array.isArray(item.extras) && item.extras.length > 0 && (
                                <div className="pl-2">
                                  <span className="font-semibold">Adicionais:</span>
                                  <ul className="list-disc list-inside">
                                    {item.extras.map((e, i) => (
                                      <li key={i}>{e}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}

                          {order.type === "entrega" && order.address && (
                            <div className="pt-1">
                              <span className="font-semibold">Endereço de Entrega:</span>
                              <p>
                                {order.address.street}, {order.address.number}
                                {order.address.complement && ` - ${order.address.complement}`}
                                <br />
                                {order.address.neighborhood}, {order.address.city} - {order.address.zipCode}
                                {order.address.reference && <br />}
                                {order.address.reference}
                              </p>
                            </div>
                          )}

                          <div className="pt-1">
                            <span className="font-semibold">Forma de Pagamento:</span>
                            <p>{getPaymentInfo(order.paymentMethod)}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(order.id)}
                          className="rounded-xl text-xs text-gray-600 hover:text-gray-800"
                        >
                          {expandedOrderId === order.id ? "Ocultar detalhes" : "Exibir detalhes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Botão para novo pedido */}
              <div className="pt-4">
                <Button
                  className="w-full rounded-xl text-sm py-2"
                  onClick={() => router.push("/")}
                >
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
