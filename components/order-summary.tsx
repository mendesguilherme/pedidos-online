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

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-50 bg-white border-t shadow-lg">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex justify-between items-start gap-4">
            {/* Coluna da esquerda: Resumo dos valores */}
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p>{itemCount} {itemCount === 1 ? "Açaí" : "Açaís"}</p>
              <p>Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}</p>
              {deliveryFee > 0 && (
                <p>Taxa de entrega: R$ {deliveryFee.toFixed(2).replace(".", ",")}</p>
              )}
              <p className="text-sm sm:text-base font-bold text-primary mt-1">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Coluna da direita: Botões empilhados */}
            <div className="flex flex-col gap-2 items-end min-w-[140px]">
              {currentTab === "produtos" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddAcai}
                  disabled={!canAddAcai}
                  className="text-xs sm:text-sm border-primary text-primary hover:bg-primary/10 w-full"
                >
                  Adicionar ao Carrinho
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNextStep}
                disabled={!buttonState.enabled}
                className={`text-xs sm:text-sm px-4 w-full ${
                  buttonState.enabled
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {buttonState.label}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
