"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { OrderSummary } from "@/components/order-summary"
import { NavigationTabs } from "@/components/navigation-tabs"
import { AddressForm } from "@/components/address-form"
import { PaymentForm } from "@/components/payment-form"
import { CartEmptyWarning } from "@/components/cart-empty-warning"
import { BottomNavigation } from "@/components/bottom-navigation"
import { products, Product } from "@/data/products"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export default function ProdutosPage() {
  const searchParams = useSearchParams()
  const initialTipo = searchParams.get("tipo")
  const [tipo, setTipo] = useState(initialTipo)
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("produtos")

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

  const handleTipoChange = (newTipo: string) => {
    if (activeTab === "pagamento" && newTipo === "entrega" && tipo === "entrega" && initialTipo === "entrega") {
      setActiveTab("endereco")
    } else {
      setTipo(newTipo)
    }
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId)

      if (quantity === 0) {
        return prevCart.filter((item) => item.id !== productId)
      }

      if (existingItem) {
        return prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item))
      } else {
        const product = products.find((p) => p.id === productId)
        if (product) {
          return [
            ...prevCart,
            {
              id: product.id,
              name: product.name,
              price: product.price,
              quantity,
            },
          ]
        }
      }

      return prevCart
    })
  }

  const getQuantity = (productId: number) => {
    const item = cart.find((item) => item.id === productId)
    return item ? item.quantity : 0
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const entregaFee = tipo === "entrega" ? 5.0 : 0
  const total = subtotal + entregaFee

  const handleNextStep = () => {
    if (cart.length === 0) {
      alert("Adicione pelo menos um item ao carrinho para continuar.")
      setActiveTab("produtos")
      return
    }

    if (activeTab === "produtos") {
      if (initialTipo === "retirada") {
        setActiveTab("pagamento")
      } else {
        setActiveTab("endereco")
      }
    } else if (activeTab === "endereco") {
      setActiveTab("pagamento")
    } else if (activeTab === "pagamento") {
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

      if (tipo === "entrega" && !isAddressValid()) {
        alert("Preencha todos os campos obrigatórios do endereço de entrega.")
        if (initialTipo === "entrega") {
          setActiveTab("endereco")
        }
        return
      }

      if (!paymentMethod) {
        alert("Selecione uma forma de pagamento para finalizar o pedido.")
        return
      }

      alert("Pedido finalizado com sucesso!")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-6 pb-32">
          {activeTab === "produtos" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Nosso Cardápio</h1>
                <p className="text-gray-600">
                  Pedido para: <span className="font-semibold capitalize">{tipo}</span>
                </p>
              </div>

              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={getQuantity(product.id)}
                    onQuantityChange={(quantity) => updateQuantity(product.id, quantity)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "endereco" && initialTipo === "entrega" && (
            <div>
              <CartEmptyWarning show={cart.length === 0} currentTab={activeTab} />
              <AddressForm tipo={tipo} address={deliveryAddress} onAddressChange={setDeliveryAddress} />
            </div>
          )}

          {activeTab === "pagamento" && (
            <div>
              <CartEmptyWarning show={cart.length === 0} currentTab={activeTab} />
              <PaymentForm
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cardData={cardData}
                onCardDataChange={setCardData}
                total={total}
                tipo={tipo}
                onTipoChange={handleTipoChange}
                deliveryAddress={deliveryAddress}
                onDeliveryAddressChange={setDeliveryAddress}
                initialTipo={initialTipo}
              />
            </div>
          )}
        </div>

        <OrderSummary
          subtotal={subtotal}
          deliveryFee={entregaFee}
          total={total}
          itemCount={cart.length}
          currentTab={activeTab}
          tipo={tipo}
          initialTipo={initialTipo}
          hasItems={cart.length > 0}
          deliveryAddress={deliveryAddress}
          paymentMethod={paymentMethod}
          onNextStep={handleNextStep}
        />
      </div>

      <BottomNavigation />
    </div>
  )
}
