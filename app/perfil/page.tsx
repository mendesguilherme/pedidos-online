"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ArrowLeft, Settings, Wrench, Home } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function PerfilPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-3">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <User className="w-6 h-6 mr-2 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">Perfil</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu Principal</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 pb-20">
          <Card>
            <CardContent className="text-center py-16">
              <div className="mb-6">
                <Wrench className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-700 mb-3">Página em Construção</h2>

              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Estamos trabalhando para trazer uma experiência incrível para você. Em breve você poderá gerenciar seu
                perfil, endereços, formas de pagamento e muito mais!
              </p>

              <div className="space-y-3 text-sm text-gray-600 mb-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Dados pessoais</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Endereços salvos</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Formas de pagamento</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Configurações</span>
                </div>
              </div>

              <Button onClick={() => router.push("/")} className="bg-gray-700 hover:bg-gray-800">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Menu Principal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
