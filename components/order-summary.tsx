"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface OrderSummaryProps {
  subtotal: number
  deliveryFee: number
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
  deliveryFee,
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

  const isPaymentValid = () => {
    return paymentMethod !== ""
  }

  const getButtonState = () => {
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
  const showThreeSteps = initialTipo === "entrega"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg min-h-[170px]">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 text-base sm:text-lg">
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}
              </p>
              {deliveryFee > 0 && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  Taxa de entrega: R$ {deliveryFee.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-primary">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          <Button
            className={`w-full py-2 sm:py-3 text-base sm:text-lg transition-all ${
              buttonState.enabled
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            onClick={onNextStep}
            disabled={!buttonState.enabled}
          >
            {buttonState.label}
          </Button>

          <div className="flex justify-center mt-3 space-x-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentTab === "produtos"
                  ? "bg-primary"
                  : hasItems
                    ? "bg-accent"
                    : "bg-muted"
              }`}
            />

            {showThreeSteps && (
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentTab === "endereco"
                    ? "bg-primary"
                    : hasItems && isAddressValid()
                      ? "bg-accent"
                      : hasItems
                        ? "bg-secondary"
                        : "bg-muted"
                }`}
              />
            )}

            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentTab === "pagamento"
                  ? "bg-primary"
                  : hasItems && isAddressValid() && isPaymentValid()
                    ? "bg-accent"
                    : hasItems && isAddressValid()
                      ? "bg-secondary"
                      : "bg-muted"
              }`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
