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

import { useCart } from "@/context/CartContext"

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
  hasSelectedCup: boolean
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
  hasSelectedCup,
  onNextStep,
  onAddAcai,
  setTab,
}: OrderSummaryProps) {
  const [showModal, setShowModal] = useState(false)

  const { cart } = useCart()
  const paymentMethod = cart.paymentMethod
  const deliveryAddress = cart.deliveryAddress || {
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    zipCode: "",
    complement: "",
    reference: "",
  }

  const isAddressValid = () => {
    if (tipo === "retirada") return true

    const address = cart.deliveryAddress

    if (!address) return false // <- ESSENCIAL!

    return (
      address.street?.trim() !== "" &&
      address.number?.trim() !== "" &&
      address.neighborhood?.trim() !== "" &&
      address.city?.trim() !== "" &&
      address.zipCode?.trim() !== ""
    )
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const isPaymentValid = () => paymentMethod !== ""

  const buttonState = {
    enabled:
      currentTab === "pagamento"
        ? !!cart.paymentMethod
        : currentTab === "produtos"
        ? cart.items.length > 0
        : true,
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
    const isEnderecoStep = currentTab === "endereco"
    const isPagamentoStep = currentTab === "pagamento"
    
    if (isEnderecoStep && !isAddressValid()) {      
      setShowModal(true)
      return
    }

    if (isPagamentoStep && !isPaymentValid()) {      
      setShowModal(true)
      return
    }

    setShowModal(false)
    onNextStep()    
  }

  return (
    <div className="fixed bottom-[56px] left-0 right-0 z-50 bg-white border-t shadow-lg h-[145]">
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
          <div className="px-4 pt-1 pb-1"> {/* Container com controle de espaçamento */}
            {currentTab === "produtos" && (            
              <Button
                size="sm"
                onClick={handleAddAcai}
                disabled={!hasSelectedCup}
                className="text-xs sm:text-sm px-4 py-6 w-full rounded-md bg-primary hover:bg-primary/90 text-white"
                style={{ borderRadius: "6px" }}
              >
                Adicionar ao Carrinho
              </Button>            
            )}

            {currentTab !== "produtos" && (
              <Button
                size="sm"
                onClick={handleNextStepClick}
                className="text-xs sm:text-sm px-4 py-6 w-full rounded-md bg-primary hover:bg-primary/90 text-white"
                style={{ borderRadius: "6px" }}
              >
                {buttonState.label}
              </Button>
            )}
          </div>          
        </CardContent>
      </Card>

      {/* Modal de sucesso ou erro */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent aria-describedby="descricao-do-modal" className="rounded-lg sm:max-w-md w-full px-4 text-sm sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-center">
            {currentTab === "pagamento" && !cart.paymentMethod
              ? "Selecione uma forma de pagamento!"
              : currentTab === "endereco"
              ? "Preencha todos os campos obrigatórios"
              : "Açaí adicionado com sucesso!"}
          </DialogTitle>

          </DialogHeader>

          {currentTab === "endereco" && (
            <DialogFooter className="flex justify-center pt-4">
              <Button onClick={() => setShowModal(false)} className="rounded-md">
                OK, Entendi!
              </Button>
            </DialogFooter>
          )}

          {currentTab === "produtos" && (
            <DialogFooter className="flex justify-center pt-4 gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="rounded-xl px-6 py-2 text-sm"
              >
                Montar outro Açaí
              </Button>

              <Button
                onClick={() => {
                  setShowModal(false)
                  setTab(tipo === "retirada" ? "pagamento" : "endereco")
                }}
                className="rounded-xl px-6 py-2 text-sm"
              >
                {tipo === "retirada" ? "Definir Forma de Pagamento" : "Ir para Endereço de Entrega"}
              </Button>

            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>


      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent aria-describedby="descricao-do-modal">
          <DialogHeader>
            <DialogTitle>Seleção Incompleta</DialogTitle>
            <DialogDescription>
              Você selecionou menos acompanhamentos que o fornecido.
              Deseja prosseguir mesmo assim?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <Button
              onClick={() => {
                setShowWarning(false)
                onAddAcai(true)
                setShowModal(true)
              }}
              className="rounded-xl px-6 py-2 text-sm"
            >
              Sim
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowWarning(false)}
              className="rounded-xl px-6 py-2 text-sm"
            >
              Não
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
