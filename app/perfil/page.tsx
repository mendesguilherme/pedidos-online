"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ArrowLeft, Settings, Wrench, Home } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function PerfilPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm rounded-b-xl">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <User className="w-5 h-5 mr-1 text-gray-600" />
              <h1 className="text-base font-semibold text-gray-800">Perfil</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 pb-20">
          <Card className="rounded-xl">
            <CardContent className="text-center py-8 px-4 rounded-xl">
              <div className="mb-4">
                <Wrench className="w-14 h-14 mx-auto mb-2 text-gray-400" />
                <Settings className="w-8 h-8 mx-auto mb-3 text-gray-500" />
              </div>

              <h2 className="text-lg font-semibold text-gray-700 mb-2">Página em Construção</h2>

              <p className="text-gray-500 mb-4 max-w-xs mx-auto text-sm">
                Em breve você poderá gerenciar seu perfil, endereços, formas de pagamento e mais!
              </p>

              <div className="space-y-2 text-gray-600 mb-6">
                {["Dados pessoais", "Endereços salvos", "Formas de pagamento", "Configurações"].map((item, i) => (
                  <div key={i} className="flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => router.push("/")}
                className="bg-gray-700 hover:bg-gray-800 rounded-xl px-4 py-2 text-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
