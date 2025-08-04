"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Truck, Info, User, Clock } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { RestaurantStatus } from "@/components/restaurant-status"
import { isRestaurantOpen } from "@/utils/business-hours"

export default function HomePage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isRestaurantOpen())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleOptionSelect = (option: "retirada" | "entrega") => {
    if (!isOpen) {
      return // Prevent navigation when closed
    }
    router.push(`/produtos?tipo=${option}`)
  }

  const handleNavigation = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <User className="w-4 h-4" />
          <span className="font-medium text-sm">Clique para entrar</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-800"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-4 space-y-4">
          {/* Logo Circle - Reduzido */}
          <div className="relative">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center shadow-xl border-2 border-gray-600">
              <div className="text-center text-white">
                <div className="text-sm font-bold mb-0.5">RESTAURANTE</div>
                <div className="text-xs font-semibold">SABOR</div>
              </div>
            </div>
            {/* Decorative border */}
            <div
              className="absolute inset-0 w-24 h-24 rounded-full border border-dashed border-gray-500 animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
          </div>

          {/* Restaurant Status - Compacto */}
          <div className="w-full max-w-sm">
            <RestaurantStatus />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-xs relative z-20">
            <Button
              onClick={() => handleOptionSelect("entrega")}
              disabled={!isOpen}
              className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform transition-all duration-200 ${
                isOpen
                  ? "bg-gray-700 hover:bg-gray-800 text-white hover:scale-105"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              <div className={`p-1.5 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-gray-300"}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">ENTREGA</span>
                {!isOpen && <span className="text-xs text-gray-500">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("retirada")}
              disabled={!isOpen}
              className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform transition-all duration-200 ${
                isOpen
                  ? "bg-gray-700 hover:bg-gray-800 text-white hover:scale-105"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              <div className={`p-1.5 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-gray-300"}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">RETIRADA</span>
                {!isOpen && <span className="text-xs text-gray-500">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleNavigation("/sobre")}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <div className="bg-white bg-opacity-20 p-1.5 rounded">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-base">SOBRE NÓS</span>
            </Button>
          </div>

          {/* Closed Message - Compacto */}
          {!isOpen && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full max-w-sm text-center">
              <div className="flex items-center justify-center space-x-2 text-red-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-semibold text-sm">Estamos Fechados</span>
              </div>
              <p className="text-xs text-red-700">Consulte nossos horários na seção "Sobre Nós".</p>
            </div>
          )}

          {/* Food Image - Menor */}
          <div className="absolute bottom-16 left-0 right-0 h-20 overflow-hidden z-0">
            <div className="relative w-full h-full">
              <Image
                src="/placeholder.svg?height=120&width=400&text=Delicious+Food"
                alt="Comida deliciosa"
                fill
                className={`object-cover transition-opacity duration-300 ${isOpen ? "opacity-40" : "opacity-20"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
