"use client"

import { useState } from "react"
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

export default function ProdutosPage() {
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

  const handleCupSelect = (cup: CupSizeOption) => {
    setSelectedCup(cup)
    setSelectedToppings([])
    setSelectedExtras([])
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

  const subtotal = selectedCup?.price || 0
  const toppingsPrice = 0 // acompanhamentos inclusos
  const extrasPrice = selectedExtras.reduce((sum, extraName) => {
    const found = addons.find((e) => e.name === extraName)
    return found ? sum + found.price : sum
  }, 0)
  const entregaFee = tipo === "entrega" ? 5.0 : 0
  const total = subtotal + toppingsPrice + extrasPrice + entregaFee

  const handleNextStep = () => {
    if (!selectedCup) {
      alert("Escolha um tamanho de copo de açaí para continuar.")
      return
    }
    if (selectedToppings.length !== selectedCup.maxToppings) {
      alert(`Escolha exatamente ${selectedCup.maxToppings} acompanhamentos.`)
      return
    }
    if (activeTab === "produtos") {
      setActiveTab(initialTipo === "retirada" ? "pagamento" : "endereco")
    } else if (activeTab === "endereco") {
      const valid = deliveryAddress.street && deliveryAddress.number && deliveryAddress.neighborhood && deliveryAddress.city && deliveryAddress.zipCode
      if (!valid) {
        alert("Preencha os dados obrigatórios do endereço.")
        return
      }
      setActiveTab("pagamento")
    } else if (activeTab === "pagamento") {
      if (!paymentMethod) {
        alert("Escolha um método de pagamento.")
        return
      }
      alert("Pedido finalizado com sucesso!")
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 flex flex-col">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-2 pb-48">
          {activeTab === "produtos" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Monte seu Açaí</h1>
              <p className="text-center text-gray-600 mt-0">Escolha um tamanho, acompanhamentos e adicionais opcionais.</p>

              <div>
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
                <div>
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
              <CartEmptyWarning show={!selectedCup} currentTab={activeTab} />
              <AddressForm tipo={tipo} address={deliveryAddress} onAddressChange={setDeliveryAddress} />
            </>
          )}

          {activeTab === "pagamento" && (
            <>
              <CartEmptyWarning show={!selectedCup} currentTab={activeTab} />
              <PaymentForm
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cardData={cardData}
                onCardDataChange={setCardData}
                total={total}
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
          subtotal={subtotal + toppingsPrice + extrasPrice}
          deliveryFee={entregaFee}
          total={total}
          itemCount={selectedCup ? 1 : 0}
          currentTab={activeTab}
          tipo={tipo}
          initialTipo={initialTipo}
          hasItems={!!selectedCup}
          deliveryAddress={deliveryAddress}
          paymentMethod={paymentMethod}
          onNextStep={handleNextStep}
        />
      </div>

      <BottomNavigation />
    </div>
  )
}
