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
        <div className="flex justify-center py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToHome}
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-sm sm:text-base"
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
                className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 rounded-none border-b-2 transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
