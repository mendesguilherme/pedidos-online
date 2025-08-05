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
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-6 pb-32">
          {activeTab === "produtos" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-center text-gray-800">Monte seu Açaí</h1>
              <p className="text-center text-gray-600">Escolha um tamanho, acompanhamentos e adicionais opcionais.</p>

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
                    <div className="grid grid-cols-2 gap-2">
                      {toppings.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => handleToppingToggle(t.name)}
                          className={`p-2 rounded border ${
                            selectedToppings.includes(t.name) ? "border-blue-500" : "border-gray-300"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Selecionados: {selectedToppings.length}/{selectedCup.maxToppings}</p>
                  </div>

                  <div>
                    <h2 className="font-semibold mt-6 mb-2">Adicionais (opcionais)</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {addons.map((extra) => (
                        <button
                          key={extra.name}
                          onClick={() => handleExtraToggle(extra.name)}
                          className={`p-2 rounded border ${selectedExtras.includes(extra.name) ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                        >
                          {extra.name} (+R$ {extra.price.toFixed(2)})
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
