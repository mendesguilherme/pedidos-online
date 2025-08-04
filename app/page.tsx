/* HomePage.tsx com correção de layout fixo para BottomNavigation visível */

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
    const interval = setInterval(updateStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleOptionSelect = (option: "retirada" | "entrega") => {
    if (!isOpen) return
    router.push(`/produtos?tipo=${option}`)
  }

  const handleNavigation = (route: string) => {
    router.push(route)
  }

  return (
    <div className="h-screen flex flex-col justify-between bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <User className="w-4 h-4" />
          <span className="font-medium text-sm">CLIQUE PARA ENTRAR</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-muted to-primary"></div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-4 space-y-4">
          {/* Logo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full shadow-xl border-2 border-muted overflow-hidden">
              <Image
                src="/images/logo.png"
                alt="Logo da empresa"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute inset-0 w-24 h-24 rounded-full border border-dashed border-accent animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
          </div>

          {/* Status */}
          <div className="w-full max-w-sm">
            {typeof window !== "undefined" && isOpen !== null && <RestaurantStatus />}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-xs relative z-20">
            <Button
              onClick={() => handleOptionSelect("entrega")}
              disabled={!isOpen}
              className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform transition-all duration-200 ${
                isOpen
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <div className={`p-1.5 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">ENTREGA</span>
                {!isOpen && <span className="text-xs text-muted-foreground">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("retirada")}
              disabled={!isOpen}
              className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform transition-all duration-200 ${
                isOpen
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <div className={`p-1.5 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">RETIRADA</span>
                {!isOpen && <span className="text-xs text-muted-foreground">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleNavigation("/sobre")}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-3 px-4 rounded-lg flex items-center justify-start space-x-3 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <div className="bg-white bg-opacity-20 p-1.5 rounded">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-base">SOBRE NÓS</span>
            </Button>
          </div>

          {/* Aviso Fechado */}
          {!isOpen && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3 w-full max-w-sm text-center">
              <div className="flex items-center justify-center space-x-2 text-destructive mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-semibold text-sm">Estamos Fechados</span>
              </div>
              <p className="text-xs text-destructive">Consulte nossos horários na seção "Sobre Nós".</p>
            </div>
          )}
        </div>
      </div>

      {/* Navegação inferior */}
      <BottomNavigation />
    </div>
  )
}
