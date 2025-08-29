"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { useAddons } from "@/hooks/use-addons"

interface OrderSummaryProps {
  subtotal: number
  deliveryFee: number
  total: number
  itemCount: number
  currentTab: string
  tipo: string | null
  initialTipo: string | null
  hasItems: boolean
  canAddProduct: boolean
  hasSelectedProduct: boolean
  onNextStep: () => void
  onAddProduct: (force?: boolean) => void
  setTab: (tab: string) => void

  /** Pré-visualização (tela de produtos) */
  draftProductPrice?: number               // preço do produto ativo (para manter compat.)
  draftExtraIds?: number[]                 // extras selecionados no produto ativo
  mustFillToppings?: boolean

  /** NOVO: prévia de seleção múltipla */
  draftSelectionBaseTotal?: number         // soma de (preço * quantidade) de todos os itens selecionados (sem extras)
  draftActiveQty?: number                  // quantidade do produto ativo (aplica extras * qty)
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
  canAddProduct,
  hasSelectedProduct,
  onNextStep,
  onAddProduct,
  setTab,
  draftProductPrice,
  draftExtraIds,
  mustFillToppings = false,

  // 🔹 novos
  draftSelectionBaseTotal = 0,
  draftActiveQty = 0,
}: OrderSummaryProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const { cart } = useCart()
  const paymentMethod = cart.paymentMethod

  // addons para calcular o total dos extras
  const { data: addonsDb } = useAddons()

  // ======== TOTAIS DO CARRINHO (contexto) =========
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

  const itemCountFromCart = useMemo(
    () => (cart.items ?? []).reduce((s, it: any) => s + Number(it?.quantity ?? 1), 0),
    [cart.items]
  )

  const effectiveTipo = (tipo ?? cart.tipo ?? initialTipo ?? "retirada").toString().toLowerCase()

  const feeFromCart = useMemo(
    () => (effectiveTipo === "entrega" ? round2(Number((cart as any)?.deliveryFee ?? 0)) : 0),
    [effectiveTipo, (cart as any)?.deliveryFee]
  )

  const shouldShowDeliveryRow = effectiveTipo === "entrega"

  // ======== PRÉ-VISUALIZAÇÃO (tela de produtos) =========
  // soma dos extras do produto ativo (por unidade)
  const extrasPerUnit = useMemo(() => {
    if (currentTab !== "produtos" || !hasSelectedProduct) return 0
    const ids = Array.isArray(draftExtraIds) ? draftExtraIds : []
    const list = addonsDb ?? []
    const priceMap = new Map<number, number>(list.map(a => [a.id, Number(a.price ?? 0)]))
    const sum = ids.reduce((acc, id) => acc + (priceMap.get(id) ?? 0), 0)
    return Number.isFinite(sum) ? sum : 0
  }, [currentTab, hasSelectedProduct, draftExtraIds, addonsDb])

  // total dos extras considerando a quantidade do produto ativo
  const extrasTotalForActive = useMemo(
    () => round2(extrasPerUnit * Number(draftActiveQty ?? 0)),
    [extrasPerUnit, draftActiveQty]
  )

  // Subtotal exibido: carrinho (contexto) + prévia múltipla (se na aba produtos)
  const displaySubtotal = useMemo(() => {
    if (currentTab === "produtos") {
      // draftSelectionBaseTotal já considera (preço * qty) de todos os itens selecionados
      return round2(itemsSubtotal + draftSelectionBaseTotal + extrasTotalForActive)
    }
    return itemsSubtotal
  }, [currentTab, itemsSubtotal, draftSelectionBaseTotal, extrasTotalForActive])

  const displayDeliveryFee = useMemo(
    () => (shouldShowDeliveryRow ? feeFromCart : 0),
    [shouldShowDeliveryRow, feeFromCart]
  )

  const displayTotal = useMemo(
    () => round2(displaySubtotal + displayDeliveryFee),
    [displaySubtotal, displayDeliveryFee]
  )

  // ========= validações =========
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
        : (initialTipo ?? cart.tipo) === "entrega"
        ? "Informar Endereço de Entrega"
        : "Definir Forma de Pagamento",
  }

  // ✅ Ao adicionar, vai direto ao carrinho
  const handleAddProduct = () => {
    if (mustFillToppings && !canAddProduct) {
      setShowWarning(true);
      return;
    }
    onAddProduct(true);   // força adicionar (quando permitido)
    router.push("/carrinho");
  };

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
                {itemCountFromCart} {itemCountFromCart === 1 ? "Item" : "Itens"}
              </p>
              <p className="whitespace-nowrap">
                Subtotal: {fmtBRL(displaySubtotal)}
              </p>
              {shouldShowDeliveryRow && (
                <p className="whitespace-nowrap">
                  Taxa de entrega: {fmtBRL(displayDeliveryFee)}
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
                onClick={handleAddProduct}
                disabled={!hasSelectedProduct || !canAddProduct}
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

      {/* Mantém modais de validação; sem modal “produto adicionado” */}
      {currentTab !== "produtos" && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent
            aria-describedby="descricao-do-modal"
            className="rounded-lg sm:max-w-md w-full px-4 text-sm sm:mx-auto"
          >
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-center">
                {currentTab === "pagamento" && !cart.paymentMethod
                  ? "Selecione uma forma de pagamento!"
                  : "Preencha todos os campos obrigatórios"}
              </DialogTitle>
            </DialogHeader>

            {currentTab === "endereco" && (
              <DialogFooter className="flex justify-center pt-4">
                <Button onClick={() => setShowModal(false)} className="rounded-md">
                  OK, Entendi!
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de aviso (seleção obrigatória) — mantém */}
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
