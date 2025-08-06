"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  setTab: (tab: string) => void // <- adicionar prop se quiser trocar aba
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
  setTab,
}: OrderSummaryProps) {
  const [showModal, setShowModal] = useState(false)

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

  const buttonState = (() => {
    if (!hasItems) return { enabled: false, label: "Informar Endereço de Entrega" }
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
        return { enabled: false, label: "Carregando..." }
    }
  })()

  const handleAddAcai = () => {
    if (!canAddAcai) {
      // Retorne modal de erro ou feedback
      alert("Por favor, selecione um copo e os acompanhamentos antes de adicionar.")
      return
    }

    // Adiciona ao carrinho
    onAddAcai()
    // Abre modal com opções
    setShowModal(true)
  }

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-50 bg-white border-t shadow-lg">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-2 sm:p-4">
          <div className="flex justify-between items-start gap-4">
            {/* Resumo dos valores */}
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-2">
              <p className="whitespace-nowrap">
                {itemCount} {itemCount === 1 ? "Açaí" : "Açaís"}
              </p>
              <p className="whitespace-nowrap">
                Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}
              </p>
              {deliveryFee > 0 && (
                <p className="whitespace-nowrap">
                  Taxa de entrega: R$ {deliveryFee.toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="whitespace-nowrap text-sm sm:text-base font-bold text-primary mt-1">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Botões */}
            <div
              className={`flex flex-col ${
                currentTab !== "produtos" ? "justify-center" : "justify-center"
              } items-end justify-center min-h-[90px] w-full sm:min-w-[140px] pr-4`}
            >
              {currentTab === "produtos" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAcai}
                  className="text-xs sm:text-sm border-primary text-primary hover:bg-primary/10 px-4 py-1 w-full rounded-md"
                  style={{ borderRadius: "6px" }} // força o arredondamento se necessário
                >
                  Adicionar ao Carrinho
                </Button>

              )}

              {currentTab !== "produtos" && (
                <Button
                  size="sm"
                  onClick={onNextStep}
                  disabled={!buttonState.enabled}
                  className={`text-xs sm:text-sm px-4 rounded-md ${
                    currentTab !== "produtos" ? "max-w-[200]" : "w-full"
                  } ${
                    buttonState.enabled
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  style={{ borderRadius: "6px" }} // reforço direto no estilo inline
                >
                  {buttonState.label}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="mx-4 sm:mx-auto rounded-lg sm:max-w-md w-full text-sm">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Açaí adicionado com sucesso!
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="rounded-md"
            >
              Montar outro Açaí
            </Button>
            <Button
              onClick={() => {
                setShowModal(false)
                setTab("endereco")
              }}
              className="rounded-md"
            >
              Ir para Endereço de Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
