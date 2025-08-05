"use client"

import { useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { NavigationTabs } from "@/components/navigation-tabs"
import { AddressForm } from "@/components/address-form"
import { PaymentForm } from "@/components/payment-form"
import { CartEmptyWarning } from "@/components/cart-empty-warning"
import { OrderSummary } from "@/components/order-summary"
import { BottomNavigation } from "@/components/bottom-navigation"
import { acaiCups } from "@/data/products"
import type { CupSizeOption, CupSizeOptionWithChoices } from "@/data/products"
import { toppings } from "@/data/toppings"
import { addons } from "@/data/addons"
import { AcaiCupSelector } from "@/components/AcaiCupSelector"

export default function ProdutosPage() {
  const toppingsRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const initialTipo = searchParams.get("tipo") || "entrega"
  const [tipo, setTipo] = useState(initialTipo)
  const [activeTab, setActiveTab] = useState("produtos")
  const [selectedCup, setSelectedCup] = useState<CupSizeOption | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [cartItems, setCartItems] = useState<CupSizeOptionWithChoices[]>([])

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

  const handleAddToCart = () => {
    if (!selectedCup) return
    if (selectedToppings.length !== selectedCup.maxToppings) return

    const newItem: CupSizeOptionWithChoices = {
      ...selectedCup,
      toppings: [...selectedToppings],
      extras: [...selectedExtras],
    }

    setCartItems((prev) => [...prev, newItem])
    resetMontagem()
    document.getElementById("acai-cup-selector")?.scrollIntoView({ behavior: "smooth" })
  }

  const entregaFee = tipo === "entrega" ? 5.0 : 0

  const handleNextStep = () => {
    if (activeTab === "produtos") {
      if (cartItems.length === 0) return
      setActiveTab(initialTipo === "retirada" ? "pagamento" : "endereco")
    } else if (activeTab === "endereco") {
      const valid = deliveryAddress.street && deliveryAddress.number && deliveryAddress.neighborhood && deliveryAddress.city && deliveryAddress.zipCode
      if (!valid) return
      setActiveTab("pagamento")
    } else if (activeTab === "pagamento") {
      if (!paymentMethod) return
      alert("Pedido finalizado com sucesso!")
    }
  }

  const resetMontagem = () => {
    setSelectedCup(null)
    setSelectedToppings([])
    setSelectedExtras([])
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-2 pb-48">
          {activeTab === "produtos" && (
            <div className="space-y-6">
              <div className="m-1 p-0 leading-none">
                <h1 className="text-2xl font-bold text-center text-gray-800 m-0 p-0 leading-none">Monte seu Açaí</h1>
                <p className="text-center text-gray-600 m-1 p-1 text-sm leading-none">Escolha um tamanho, acompanhamentos e adicionais opcionais.</p>
              </div>

              <div id="acai-cup-selector">
                <h2 className="font-semibold mb-2">Tamanho do Copo</h2>
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
                  <div ref={toppingsRef}>
                    <h2 className="font-semibold mt-6 mb-2">Acompanhamentos (obrigatórios)</h2>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {toppings.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => handleToppingToggle(t.name)}
                          className={`flex flex-col items-center p-2 border rounded-xl transition-all ${
                            selectedToppings.includes(t.name)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {t.imageUrl && (
                            <img
                              src={t.imageUrl}
                              alt={t.name}
                              className="w-16 h-16 rounded-full object-cover mb-1"
                            />
                          )}
                          <span className="text-xs text-center text-gray-800 font-medium">
                            {t.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Selecionados: {selectedToppings.length}/{selectedCup.maxToppings}
                    </p>
                  </div>

                  <div>
                    <h2 className="font-semibold mt-6 mb-2">Adicionais (opcionais)</h2>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {addons.map((extra) => (
                        <button
                          key={extra.name}
                          onClick={() => handleExtraToggle(extra.name)}
                          className={`flex flex-col items-center p-2 border rounded-xl transition-all ${
                            selectedExtras.includes(extra.name)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {extra.imageUrl && (
                            <img
                              src={extra.imageUrl}
                              alt={extra.name}
                              className="w-16 h-16 rounded-full object-cover mb-1"
                            />
                          )}
                          <span className="text-xs text-center text-gray-800 font-medium">
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
              <CartEmptyWarning show={cartItems.length === 0} currentTab={activeTab} />
              <AddressForm tipo={tipo} address={deliveryAddress} onAddressChange={setDeliveryAddress} />
            </>
          )}

          {activeTab === "pagamento" && (
            <>
              <CartEmptyWarning show={cartItems.length === 0} currentTab={activeTab} />
              <PaymentForm
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cardData={cardData}
                onCardDataChange={setCardData}
                total={cartItems.reduce((sum, item) => sum + item.price + item.extras.reduce((acc, name) => {
                  const found = addons.find((a) => a.name === name)
                  return found ? acc + found.price : acc
                }, 0), 0) + entregaFee}
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
          subtotal={cartItems.reduce((sum, item) => sum + item.price, 0)}
          deliveryFee={entregaFee}
          total={cartItems.reduce((sum, item) => sum + item.price + item.extras.reduce((acc, name) => {
            const found = addons.find((a) => a.name === name)
            return found ? acc + found.price : acc
          }, 0), 0) + entregaFee}
          itemCount={cartItems.length}
          currentTab={activeTab}
          tipo={tipo}
          initialTipo={initialTipo}
          hasItems={cartItems.length > 0}
          canAddAcai={!!selectedCup && selectedToppings.length === selectedCup.maxToppings}
          deliveryAddress={deliveryAddress}
          paymentMethod={paymentMethod}
          onNextStep={handleNextStep}
          onAddAcai={handleAddToCart}
        />

        <BottomNavigation />
      </div>
    </div>
  )
}
