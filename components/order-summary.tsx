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
  canAddAcai: boolean
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
  onAddAcai: () => void
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
  canAddAcai,
  deliveryAddress,
  paymentMethod,
  onNextStep,
  onAddAcai,
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

  const isPaymentValid = () => paymentMethod !== ""

  const getButtonState = () => {
    if (!hasItems) {
      return {
        enabled: false,
        label: "Informar Endereço de Entrega",
      }
    }

    switch (currentTab) {
      case "produtos":
        return {
          enabled: hasItems,
          label:
            initialTipo === "entrega"
              ? "Informar Endereço de Entrega"
              : "Definir Forma de Pagamento",
        }
      case "endereco":
        return {
          enabled: hasItems && isAddressValid(),
          label: isAddressValid()
            ? "Definir Forma de Pagamento"
            : "Informar Endereço de Entrega",
        }
      case "pagamento":
        const needsAddress =
          tipo === "entrega" &&
          !isAddressValid() &&
          initialTipo === "retirada"
        return {
          enabled: hasItems && isPaymentValid() && !needsAddress,
          label: needsAddress
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
    <div className="fixed bottom-[64px] left-0 right-0 z-50 bg-white border-t shadow-lg min-h-[140px]">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center justify-between mb-3 text-sm sm:text-base">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "Açaí" : "Açaís"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}
              </p>
              {deliveryFee > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Taxa de entrega: R$ {deliveryFee.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-base sm:text-lg font-bold text-primary">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          {currentTab === "produtos" && (
            <Button
              variant="outline"
              onClick={onAddAcai}
              className="w-full mb-2 text-xs sm:text-sm border-primary text-primary hover:bg-primary/10"
              disabled={!canAddAcai}
            >
              Adicionar ao Carrinho
            </Button>
          )}

          <Button
            className={`w-full py-1.5 sm:py-2 text-xs sm:text-sm transition-all ${
              buttonState.enabled
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            onClick={onNextStep}
            disabled={!buttonState.enabled}
          >
            {buttonState.label}
          </Button>


          <div className="flex justify-center mt-2 space-x-1.5">
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
