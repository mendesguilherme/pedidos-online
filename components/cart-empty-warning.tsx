"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, AlertTriangle } from "lucide-react"

interface CartEmptyWarningProps {
  show: boolean
  currentTab: string
}

export function CartEmptyWarning({ show, currentTab }: CartEmptyWarningProps) {
  if (!show || currentTab === "produtos") return null

  return (
    <Card className="border-secondary bg-secondary/10 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 text-secondary-foreground">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-medium text-base">Carrinho vazio</p>
            <p className="text-base text-muted-foreground mt-1">
              Você precisa adicionar pelo menos um item ao carrinho para continuar com o pedido.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center mt-4 p-4 bg-secondary/20 rounded-lg">
          <ShoppingCart className="w-8 h-8 text-secondary mr-2" />
          <span className="text-secondary-foreground font-medium text-base">Nenhum item selecionado</span>
        </div>
      </CardContent>
    </Card>
  )
}
