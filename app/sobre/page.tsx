"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, ArrowLeft, MapPin, Clock, Home } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BUSINESS_HOURS, DAY_NAMES } from "@/utils/business-hours"

export default function SobrePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-3 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Info className="w-6 h-6 mr-2 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">Sobre Nós</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu Principal</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 pb-20 space-y-6">
          {/* Informações da Loja */}
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2 text-gray-600" />
                CHC - Produtos de Limpeza e de Piscina
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Endereço */}
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-gray-600">
                <p>Rua Abcde, 999</p>
                <p>Jardim das Flores - Bebedouro/SP</p>
                <p>CEP: 14700-000</p>
              </div>
            </CardContent>
          </Card>

          {/* Horário de Funcionamento */}
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(BUSINESS_HOURS).map(([dayKey, hours]) => {
                  const dayName = DAY_NAMES[dayKey as keyof typeof DAY_NAMES]
                  const today = new Date().getDay()
                  const dayIndex = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ].indexOf(dayKey)
                  const isToday = today === dayIndex

                  return (
                    <div
                      key={dayKey}
                      className={`flex justify-between items-center p-3 rounded-xl ${
                        isToday
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          isToday ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        {dayName}
                        {isToday && (
                          <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded-full">
                            Hoje
                          </span>
                        )}
                      </span>
                      <span
                        className={`${
                          isToday ? "text-blue-700 font-semibold" : "text-gray-600"
                        }`}
                      >
                        {hours.isOpen ? `${hours.open} às ${hours.close}` : "Fechado"}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Os pedidos online seguem rigorosamente estes horários. Fora do horário de
                  funcionamento, os botões de pedido ficam bloqueados automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="space-y-2">
            <Button onClick={() => router.push("/")} className="w-full rounded-xl">
              <Home className="w-4 h-4 mr-2" />
              Fazer um Pedido
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full rounded-xl"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
