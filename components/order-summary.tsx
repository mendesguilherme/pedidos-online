"use client"

import { useMemo, useState } from "react"
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
import { addons } from "@/data/addons"

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

  /** 👇 Valores da seleção atual na aba de produtos (opcionais) */
  draftCupPrice?: number
  draftExtraIds?: number[]
}

const round2 = (n: number) => Math.round(n * 100) / 100
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

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
  /** seleção atual (opcional) */
  draftCupPrice,
  draftExtraIds,
}: OrderSummaryProps) {
  const [showModal, setShowModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [forceAdd, setForceAdd] = useState(false)

  const { cart } = useCart()
  const paymentMethod = cart.paymentMethod

  // ---------- BLINDA VALORES (props vs cart) ----------
  const itemsSubtotal = useMemo(
    () =>
      round2(
        (cart.items ?? []).reduce<number>(
          (s, it: any) => s + Number(it?.price || 0) * Number(it?.quantity ?? 1),
          0
        )
      ),
    [cart.items]
  )

  const effectiveTipo = (tipo ?? cart.tipo ?? "retirada").toString().toLowerCase()
  const feeFromCart = useMemo(
    () => (effectiveTipo === "entrega" ? round2(Number((cart as any)?.deliveryFee ?? 0)) : 0),
    [effectiveTipo, (cart as any)?.deliveryFee]
  )

  const shouldShowDeliveryRow = effectiveTipo === "entrega"

  // Preferir props quando válidas; se não, usar fallbacks do cart
  const safeSubtotal = useMemo(
    () => (Number.isFinite(subtotal) ? round2(Number(subtotal)) : itemsSubtotal),
    [subtotal, itemsSubtotal]
  )

  const safeDeliveryFee = useMemo(() => {
    if (effectiveTipo !== "entrega") return 0
    return Number.isFinite(deliveryFee) ? round2(Number(deliveryFee)) : feeFromCart
  }, [effectiveTipo, deliveryFee, feeFromCart])

  // ---------- PRÉ-VISUALIZAÇÃO EM TEMPO REAL NA ABA "produtos" ----------
  // Soma preço do copo selecionado + totais dos adicionais selecionados (cremes não somam)
  const draftExtrasTotal = useMemo(() => {
    if (currentTab !== "produtos" || !hasSelectedCup) return 0
    const ids = Array.isArray(draftExtraIds) ? draftExtraIds : []
    const sum = ids.reduce((acc, id) => {
      const a = addons.find((x) => x.id === id)
      return acc + (a?.price ?? 0)
    }, 0)
    return round2(sum)
  }, [currentTab, hasSelectedCup, draftExtraIds])

  const draftCupSafe = useMemo(() => {
    if (currentTab !== "produtos" || !hasSelectedCup) return 0
    return round2(Number(draftCupPrice ?? 0))
  }, [currentTab, hasSelectedCup, draftCupPrice])

  // Subtotal exibido: se estiver em "produtos", mostra carrinho + seleção atual (preview)
  const displaySubtotal = useMemo(() => {
    if (currentTab === "produtos") {
      return round2(safeSubtotal + draftCupSafe + draftExtrasTotal)
    }
    return safeSubtotal
  }, [currentTab, safeSubtotal, draftCupSafe, draftExtrasTotal])

  const displayTotal = useMemo(
    () => round2(displaySubtotal + safeDeliveryFee),
    [displaySubtotal, safeDeliveryFee]
  )

  // ---------- validações ----------
  const isAddressValid = () => {
    if (effectiveTipo === "retirada") return true
    const address = cart.deliveryAddress
    if (!address) return false
    return (
      address.street?.trim() !== "" &&
      address.number?.trim() !== "" &&
      address.neighborhood?.trim() !== "" &&
      address.city?.trim() !== "" &&
      address.zipCode?.trim() !== ""
    )
  }

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

  const handleAddAcai = () => {
    if (!canAddAcai && !forceAdd) {
      setShowWarning(true)
      return
    }
    onAddAcai()
    setShowModal(true)
    setForceAdd(false)
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
                Subtotal: {fmtBRL(displaySubtotal)}
              </p>
              {shouldShowDeliveryRow && (
                <p className="whitespace-nowrap">
                  Taxa de entrega: {fmtBRL(safeDeliveryFee)}
                </p>
              )}
            </div>

            <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap self-end">
              Total: {fmtBRL(displayTotal)}
            </p>
          </div>

          {/* Linha do botão */}
          <div className="px-4 pt-1 pb-1">
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

      {/* Modal de sucesso/erro/validações */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          aria-describedby="descricao-do-modal"
          className="rounded-lg sm:max-w-md w-full px-4 text-sm sm:mx-auto"
        >
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
                  setTab(effectiveTipo === "retirada" ? "pagamento" : "endereco")
                }}
                className="rounded-xl px-6 py-2 text-sm"
              >
                {effectiveTipo === "retirada"
                  ? "Definir Forma de Pagamento"
                  : "Ir para Endereço de Entrega"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent
          aria-describedby="descricao-do-modal"
          className="rounded-lg sm:max-w-md w-full px-4 text-sm sm:mx-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-center">
              Seleção incompleta
            </DialogTitle>
            <DialogDescription id="descricao-do-modal" className="text-center">
              Para continuar, selecione todos os acompanhamentos obrigatórios.
            </DialogDescription>
          </DialogHeader>

          {/* sobrescreve o padrão do shadcn: sm:justify-end */}
          <DialogFooter className="flex flex-col sm:flex-row justify-center sm:justify-center pt-4">
            <Button onClick={() => setShowWarning(false)} className="rounded-xl px-6 py-2 text-sm">
              OK, Entendi!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
