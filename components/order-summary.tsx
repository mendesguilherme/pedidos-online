"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface OrderSummaryProps {
  subtotal: number
  entregaFee: number
  total: number
  itemCount: number
  currentTab: string
  tipo: string | null
  initialTipo: string | null
  hasItems: boolean
  deliveryAddress: {
    street: string
    number: string
    neighborhood: string
    city: string
    zipCode: string
    complement: string
    reference: string
  }
  paymentMethod: string
  onNextStep: () => void
}

export function OrderSummary({
  subtotal,
  entregaFee,
  total,
  itemCount,
  currentTab,
  tipo,
  initialTipo,
  hasItems,
  deliveryAddress,
  paymentMethod,
  onNextStep,
}: OrderSummaryProps) {
  // Validação do endereço (campos obrigatórios)
  const isAddressValid = () => {
    if (tipo === "retirada") return true
    return (
      deliveryAddress.street.trim() !== "" &&
      deliveryAddress.number.trim() !== "" &&
      deliveryAddress.neighborhood.trim() !== "" &&
      deliveryAddress.city.trim() !== "" &&
      deliveryAddress.zipCode.trim() !== ""
    )
  }

  // Validação do pagamento
  const isPaymentValid = () => {
    return paymentMethod !== ""
  }

  // Atualizar a lógica para determinar o estado do botão
  const getButtonState = () => {
    // Se não há itens no carrinho, sempre bloquear
    if (!hasItems) {
      return {
        enabled: false,
        label: "Adicione itens ao carrinho",
      }
    }

    switch (currentTab) {
      case "produtos":
        return {
          enabled: hasItems,
          label: hasItems
            ? initialTipo === "entrega"
              ? "Informar Endereço de Entrega"
              : "Definir Forma de Pagamento"
            : "Adicione itens ao carrinho",
        }
      case "endereco":
        return {
          enabled: hasItems && isAddressValid(),
          label: !hasItems
            ? "Adicione itens ao carrinho"
            : isAddressValid()
              ? "Definir Forma de Pagamento"
              : "Informar Endereço de Entrega",
        }
      case "pagamento":
        const needsAddress = tipo === "entrega" && !isAddressValid() && initialTipo === "retirada"
        return {
          enabled: hasItems && isPaymentValid() && !needsAddress,
          label: !hasItems
            ? "Adicione itens ao carrinho"
            : needsAddress
              ? "Informar Endereço de Entrega"
              : isPaymentValid()
                ? "Finalizar Pedido"
                : "Informar Forma de Pagamento",
        }
      default:
        return {
          enabled: false,
          label: "Carregando...",
        }
    }
  }

  const buttonState = getButtonState()

  // Determinar quantos indicadores de progresso mostrar
  const showThreeSteps = initialTipo === "entrega"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 text-sm sm:text-base">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}</p>
              {entregaFee > 0 && (
                <p className="text-xs sm:text-sm text-gray-600">
                  Taxa de entrega: R$ {entregaFee.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-base sm:text-lg font-bold text-green-600">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          <Button
            className={`w-full py-2 sm:py-3 text-sm sm:text-base transition-all ${
              buttonState.enabled
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={onNextStep}
            disabled={!buttonState.enabled}
          >
            {buttonState.label}
          </Button>

          {/* Indicador de progresso - 2 ou 3 etapas dependendo do tipo inicial */}
          <div className="flex justify-center mt-3 space-x-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentTab === "produtos" ? "bg-green-600" : hasItems ? "bg-green-400" : "bg-gray-300"
              }`}
            />

            {showThreeSteps && (
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentTab === "endereco"
                    ? "bg-green-600"
                    : hasItems && isAddressValid()
                      ? "bg-green-400"
                      : hasItems
                        ? "bg-yellow-400"
                        : "bg-gray-300"
                }`}
              />
            )}

            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentTab === "pagamento"
                  ? "bg-green-600"
                  : hasItems && isAddressValid() && isPaymentValid()
                    ? "bg-green-400"
                    : hasItems && isAddressValid()
                      ? "bg-yellow-400"
                      : "bg-gray-300"
              }`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
