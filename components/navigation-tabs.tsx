"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, MapPin, CreditCard, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface NavigationTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tipo: string | null
  initialTipo: string | null
}

export function NavigationTabs({ activeTab, onTabChange, tipo, initialTipo }: NavigationTabsProps) {
  const router = useRouter()

  // Mostrar a aba de endereço apenas se o tipo inicial for entrega
  const tabs = [
    { id: "produtos", label: "Produtos", icon: ShoppingCart },
    ...(initialTipo === "entrega" ? [{ id: "endereco", label: "Endereço de Entrega", icon: MapPin }] : []),
    { id: "pagamento", label: "Pagamento", icon: CreditCard },
  ]

  const handleBackToHome = () => {
    router.push("/")
  }

  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Botão Voltar ao Menu Principal */}
        <div className="flex justify-center py-2 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToHome}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs sm:text-sm"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Voltar ao Menu Principal
          </Button>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 rounded-none border-b-2 transition-colors text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
