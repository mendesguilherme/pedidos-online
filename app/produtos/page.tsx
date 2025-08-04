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

interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

const products: Product[] = [
  {
    id: 1,
    name: "Hambúrguer Clássico",
    description: "Pão artesanal, carne bovina 180g, queijo, alface, tomate e molho especial",
    price: 25.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Hambúrgueres",
  },
  {
    id: 2,
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco e azeite",
    price: 32.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Pizzas",
  },
  {
    id: 3,
    name: "Batata Frita",
    description: "Batatas crocantes temperadas com sal e ervas",
    price: 12.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Acompanhamentos",
  },
  {
    id: 4,
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Fanta - 350ml",
    price: 5.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bebidas",
  },
  {
    id: 5,
    name: "Hambúrguer Bacon",
    description: "Pão brioche, carne 200g, bacon crocante, queijo cheddar e cebola caramelizada",
    price: 29.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Hambúrgueres",
  },
  {
    id: 6,
    name: "Suco Natural",
    description: "Laranja, limão ou maracujá - 400ml",
    price: 8.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bebidas",
  },
]

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

  // Função para lidar com a mudança de tipo na tela de pagamento
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
      if (cart.length === 0) {
        alert("Adicione pelo menos um item ao carrinho para continuar.")
        setActiveTab("produtos")
        return
      }
      setActiveTab("pagamento")
    } else if (activeTab === "pagamento") {
      if (cart.length === 0) {
        alert("Adicione pelo menos um item ao carrinho para finalizar o pedido.")
        setActiveTab("produtos")
        return
      }

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
        {/* Navigation Tabs */}
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

        {/* Order Summary - Fixed at bottom */}
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
