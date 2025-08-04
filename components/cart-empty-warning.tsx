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
    <Card className="border-orange-200 bg-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 text-orange-800">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-medium">Carrinho vazio</p>
            <p className="text-sm text-orange-700 mt-1">
              Você precisa adicionar pelo menos um item ao carrinho para continuar com o pedido.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center mt-4 p-4 bg-orange-100 rounded-lg">
          <ShoppingCart className="w-8 h-8 text-orange-600 mr-2" />
          <span className="text-orange-800 font-medium">Nenhum item selecionado</span>
        </div>
      </CardContent>
    </Card>
  )
}
