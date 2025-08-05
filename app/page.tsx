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
    <div className="flex flex-col h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <div
        className="bg-primary text-primary-foreground p-3 text-center cursor-pointer hover:brightness-110 transition"
        onClick={() => router.push("/perfil")}
      >
        <div className="flex items-center justify-center space-x-2">
          <User className="w-4 h-4" />
          <span className="font-medium text-sm">CLIQUE PARA ENTRAR</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col justify-center items-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-muted to-primary" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-4 space-y-4">
          {/* Logo */}
          <div className="relative">
            <div className="w-36 h-36 rounded-full shadow-xl border-2 border-muted overflow-hidden">
              <Image
                src="/images/logo.webp"
                alt="Logo da empresa"
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute inset-0 w-36 h-36 rounded-full border border-dashed border-accent animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
          </div>

          {/* Status */}
          <div className="w-full max-w-xl px-6 sm:px-8">
            {typeof window !== "undefined" && isOpen !== null && <RestaurantStatus />}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 w-full max-w-lg px-4">
            <Button
              onClick={() => handleOptionSelect("entrega")}
              disabled={!isOpen}
              className={`w-full font-semibold px-2 rounded-lg flex items-center space-x-0 shadow-lg transform transition-all duration-200 min-h-[5px] ${
                isOpen
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <div className={`p-2 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-start pl-4">
                <span className="text-base leading-none">ENTREGA</span>
                {!isOpen && <span className="text-xs text-muted-foreground leading-none">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleOptionSelect("retirada")}
              disabled={!isOpen}
              className={`w-full font-semibold px-2 rounded-lg flex items-center space-x-0 shadow-lg transform transition-all duration-200 min-h-[5px] ${
                isOpen
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <div className={`p-2 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-start pl-4">
                <span className="text-base leading-none">RETIRADA</span>
                {!isOpen && <span className="text-xs text-muted-foreground leading-none">Fechado</span>}
              </div>
            </Button>

            <Button
              onClick={() => handleNavigation("/sobre")}
              className="w-full font-semibold px-2 rounded-lg flex items-center space-x-0 shadow-lg transform transition-all duration-200 min-h-[5px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-start justify-center pl-4">
                <span className="text-base leading-none">SOBRE NÓS</span>                
              </div>

            </Button>
          </div>



          {/* Aviso Fechado */}
            {!isOpen && (
              <div className="bg-muted border border-border rounded-lg p-3 w-full max-w-md text-center">
                <div className="flex items-center justify-center space-x-2 text-red-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold text-sm">Estamos Fechados</span>
                  {/* de `text-base` → `text-sm` */}
                </div>
                <p className="text-xs text-red-500">
                  Consulte nossos horários na seção "Sobre Nós".
                  {/* de `text-sm` → `text-xs` */}
                </p>
              </div>
            )}

        </div>
      </div>

      {/* Navegação inferior */}
      <BottomNavigation />
    </div>
  )
}
