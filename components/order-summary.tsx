"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

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
  onAddAcai: (force?: boolean) => void
  setTab: (tab: string) => void
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

  const buttonState = {
    enabled: true,
    label:
      currentTab === "pagamento"
        ? "Finalizar Pedido"
        : currentTab === "endereco"
        ? "Definir Forma de Pagamento"
        : initialTipo === "entrega"
        ? "Informar Endereço de Entrega"
        : "Definir Forma de Pagamento",
  }

  const [showWarning, setShowWarning] = useState(false)

  const [forceAdd, setForceAdd] = useState(false)

  const handleAddAcai = () => {
    if (!canAddAcai && !forceAdd) {
      setShowWarning(true)
      return
    }

    onAddAcai()
    setShowModal(true)
    setForceAdd(false) // Resetar após adicionar
  }

  const handleNextStepClick = () => {
    if (currentTab === "endereco" && !isAddressValid()) {
      setShowModal(true)
      return
    }

    onNextStep()
  }

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-50 bg-white border-t shadow-lg">
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-2 sm:p-4 space-y-2">
          {/* Linha dos dados */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 flex-1 min-w-[140px]">
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
            </div>

            <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap self-end">
              Total: R$ {total.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {/* Linha do botão */}
          {currentTab === "produtos" && (
            <Button
              size="sm"
              onClick={handleAddAcai}
              className="text-xs sm:text-sm px-4 py-2 w-full rounded-md bg-primary hover:bg-primary/90 text-white"
              style={{ borderRadius: "6px" }}
            >
              Adicionar ao Carrinho
            </Button>
          )}

          {currentTab !== "produtos" && (
            <Button
              size="sm"
              onClick={handleNextStepClick}
              className="text-xs sm:text-sm px-4 py-2 w-full rounded-md bg-primary hover:bg-primary/90 text-white"
              style={{ borderRadius: "6px" }}
            >
              {buttonState.label}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modal de sucesso ou erro */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="rounded-lg sm:max-w-md w-full px-4 text-sm sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-center">
              {currentTab === "endereco"
                ? "Preencha todos os campos obrigatórios"
                : "Açaí adicionado com sucesso!"}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-center pt-2 gap-2">
            {currentTab === "endereco" ? (
              <Button onClick={() => setShowModal(false)} className="rounded-md">
                OK, Entendi!
              </Button>
            ) : (
              <>
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleção Incompleta</DialogTitle>
            <DialogDescription>
              Você selecionou menos acompanhamentos que o recomendado.
              Deseja prosseguir mesmo assim?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setShowWarning(false)} // Voltar para seleção
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Não
            </button>

            <button
              onClick={() => {
                setShowWarning(false)
                onAddAcai(true)
                setShowModal(true)
              }}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
            >
              Sim
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
