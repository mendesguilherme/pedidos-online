"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { NavigationTabs } from "@/components/navigation-tabs"
import { AddressForm } from "@/components/address-form"
import { PaymentForm } from "@/components/payment-form"
import { CartEmptyWarning } from "@/components/cart-empty-warning"
import { OrderSummary } from "@/components/order-summary"
import { BottomNavigation } from "@/components/bottom-navigation"
import { acaiCups } from "@/data/products"
import type { CupSizeOption } from "@/data/products"
import { toppings } from "@/data/toppings"
import { addons } from "@/data/addons"
import { AcaiCupSelector } from "@/components/AcaiCupSelector"
import { useCart } from "@/context/CartContext"
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Router } from "lucide-react"

export default function ProdutosPage() {
  const { clearCart } = useCart()
  const router = useRouter()
  const { cart, addItem } = useCart()
  const toppingsRef = useRef<HTMLDivElement | null>(null)
  const addonsRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const initialTipo = searchParams.get("tipo") || "entrega"
  const [tipo, setTipo] = useState(initialTipo)
  const [activeTab, setActiveTab] = useState("produtos")
  const [selectedCup, setSelectedCup] = useState<CupSizeOption | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    zipCode: "",
    reference: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("")
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  })

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleCupSelect = (cup: CupSizeOption) => {
    setSelectedCup(cup)
    setSelectedToppings([])
    setSelectedExtras([])

    setTimeout(() => {
      if (toppingsRef.current) {
        const yOffset = -100
        const y = toppingsRef.current.getBoundingClientRect().top + window.scrollY + yOffset
        window.scrollTo({ top: y, behavior: "smooth" })
      }
    }, 100)
  }

  const handleToppingToggle = (topping: string) => {
    if (!selectedCup) return
    const max = selectedCup.maxToppings
    if (selectedToppings.includes(topping)) {
      setSelectedToppings(selectedToppings.filter((t) => t !== topping))
    } else if (selectedToppings.length < max) {
      setSelectedToppings([...selectedToppings, topping])
    }
  }

  const handleExtraToggle = (extra: string) => {
    if (selectedExtras.includes(extra)) {
      setSelectedExtras(selectedExtras.filter((e) => e !== extra))
    } else {
      setSelectedExtras([...selectedExtras, extra])
    }
  }

  const handleAddToCart = (force = false) => {
    if (!selectedCup || (!force && selectedToppings.length !== selectedCup.maxToppings)) return

    const newItem = {
      id: Date.now(),
      name: `${selectedCup.name} com ${selectedToppings.length} acompanhamentos`,
      price: selectedCup.price + selectedExtras.reduce((acc, name) => {
        const found = addons.find((a) => a.name === name)
        return found ? acc + found.price : acc
      }, 0),
      quantity: 1,
      image: "/acai.webp",
      toppings: [...selectedToppings],
      extras: [...selectedExtras],
    }

    addItem(newItem)
    resetMontagem()
    document.getElementById("acai-cup-selector")?.scrollIntoView({ behavior: "smooth" })
  }

  const entregaFee = tipo === "entrega" ? 5.0 : 0

  const handleNextStep = () => {
    if (activeTab === "produtos") {
      if (cart.items.length === 0) return
      setActiveTab(initialTipo === "retirada" ? "pagamento" : "endereco")
    } else if (activeTab === "endereco") {
      setActiveTab("pagamento")
    } else if (activeTab === "pagamento") {
      if (!cart.paymentMethod) return
      setShowSuccessModal(true)
      clearCart()
    }
  }

  const resetMontagem = () => {
    setSelectedCup(null)
    setSelectedToppings([])
    setSelectedExtras([])
  }

  useEffect(() => {
    if (selectedCup && selectedToppings.length === selectedCup.maxToppings) {
      setTimeout(() => {
        if (addonsRef.current) {
          const yOffset = -100
          const y = addonsRef.current.getBoundingClientRect().top + window.scrollY + yOffset
          window.scrollTo({ top: y, behavior: "smooth" })
        }
      }, 100)
    }
  }, [selectedToppings, selectedCup])

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-2 pb-60">
          {activeTab === "produtos" && (
            <div className="space-y-4">
              <div className="m-1 p-0 leading-none">
                <h1 className="text-xl font-bold text-center text-gray-800 m-0 p-0 leading-none">Monte seu Açaí</h1>
                <p className="text-center text-gray-600 m-1 p-1 text-xs leading-none">Escolha um tamanho, acompanhamentos e adicionais opcionais.</p>
              </div>

              <div id="acai-cup-selector" className="mt-1">
                <h2 className="text-sm font-semibold mb-1">Tamanho do Copo</h2>
                <AcaiCupSelector
                  selectedCup={selectedCup?.id ?? null}
                  onChange={(id) => {
                    const cup = acaiCups.find((c) => c.id === id)
                    if (cup) handleCupSelect(cup)
                  }}
                />
              </div>

              {selectedCup && (
                <>
                  <div className="mt-2" ref={toppingsRef}>
                    <h2 className="text-sm font-semibold mb-1">Acompanhamentos (obrigatórios)</h2>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {toppings.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => handleToppingToggle(t.name)}
                          className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                            selectedToppings.includes(t.name)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {t.imageUrl && (
                            <img
                              src={t.imageUrl}
                              alt={t.name}
                              className="w-14 h-14 rounded-full object-cover mb-1"
                            />
                          )}
                          <span className="text-[11px] text-center text-gray-800 font-medium">
                            {t.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecionados: {selectedToppings.length}/{selectedCup.maxToppings}
                    </p>
                  </div>

                  <div className="mt-2" ref={addonsRef}>
                    <h2 className="text-sm font-semibold mb-1">Adicionais (opcionais)</h2>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {addons.map((extra) => (
                        <button
                          key={extra.name}
                          onClick={() => handleExtraToggle(extra.name)}
                          className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                            selectedExtras.includes(extra.name)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {extra.imageUrl && (
                            <img
                              src={extra.imageUrl}
                              alt={extra.name}
                              className="w-14 h-14 rounded-full object-cover mb-1"
                            />
                          )}
                          <span className="text-[11px] text-center text-gray-800 font-medium">
                            {extra.name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            +R$ {extra.price.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "endereco" && initialTipo === "entrega" && (
            <>
              <CartEmptyWarning show={cart.items.length === 0} currentTab={activeTab} />
              <AddressForm tipo={tipo} />
            </>
          )}

          {activeTab === "pagamento" && (
            <>
              <CartEmptyWarning show={cart.items.length === 0} currentTab={activeTab} />
              <PaymentForm
                cardData={cardData}
                onCardDataChange={setCardData}
                total={cart.items.reduce((sum, item) => {
                  const extrasTotal = item.extras.reduce((acc, name) => {
                    const found = addons.find((a) => a.name === name)
                    return found ? acc + found.price : acc
                  }, 0)
                  return sum + item.price + extrasTotal
                }, 0) + entregaFee}
                tipo={tipo}
                onTipoChange={setTipo}
                deliveryAddress={deliveryAddress}
                onDeliveryAddressChange={setDeliveryAddress}
                initialTipo={initialTipo}
              />
            </>
          )}
        </div>

        <OrderSummary          
          subtotal={cart.items.reduce((sum, item) => sum + item.price, 0)}
          deliveryFee={entregaFee}
          total={
            cart.items.reduce((sum, item) => sum + item.price, 0) + entregaFee
          }
          itemCount={cart.items.reduce((total, item) => total + item.quantity, 0)}
          currentTab={activeTab}
          setTab={setActiveTab}
          tipo={tipo}
          initialTipo={initialTipo}
          hasItems={cart.items.length > 0}
          canAddAcai={!!selectedCup && selectedToppings.length === selectedCup.maxToppings}                    
          onNextStep={handleNextStep}
          onAddAcai={handleAddToCart}
        />

        <BottomNavigation />
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="text-center px-6 pb-6">
          <DialogTitle className="text-base sm:text-lg font-semibold">
            Pedido criado com sucesso!
          </DialogTitle>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => router.push("/pedidos")}
              className="rounded-xl px-6 py-2 text-sm"
            >
              Ver pedidos
            </Button>
          </div>
        </DialogContent>
      </Dialog>



    </div>
  )
}
