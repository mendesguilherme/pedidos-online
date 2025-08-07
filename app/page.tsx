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
      <div className="relative z-10 flex flex-col items-center justify-start min-h-full p-4 pt-1 space-y-3">
        {/* Logo */}
        <div className="relative mt-2">
          <div className="w-36 h-36 rounded-full shadow-lg border-2 border-muted overflow-hidden">
            <Image
              src="/images/logo.webp"
              alt="Logo da empresa"
              width={192}
              height={192}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute inset-0 w-36 h-36 rounded-full border border-dashed border-accent animate-spin"
            style={{ animationDuration: "20s" }}
          />
        </div>

        {/* Status */}
        <div className="w-full max-w-md px-6 sm:px-8">
          {typeof window !== "undefined" && isOpen !== null && <RestaurantStatus />}
        </div>

        {/* Botões */}
        <div className="space-y-4 w-full max-w-md px-10">
          <Button
            onClick={() => handleOptionSelect("entrega")}
            disabled={!isOpen}
            className={`w-full text-base font-medium px-3 rounded-xl flex items-center space-x-3 shadow-md transition-all duration-200 min-h-[56px] ${
              isOpen
                ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <div className={`p-2 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
              <Truck className="w-8 h-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl leading-none">ENTREGA</span>
              {!isOpen && <span className="text-sm text-muted-foreground leading-none">Fechado</span>}
            </div>
          </Button>

          <Button
            onClick={() => handleOptionSelect("retirada")}
            disabled={!isOpen}
            className={`w-full text-xl font-semibold px-4 rounded-2xl flex items-center space-x-4 shadow-lg transition-all duration-200 min-h-[64px] ${
              isOpen
                ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <div className={`p-2 rounded ${isOpen ? "bg-white bg-opacity-20" : "bg-muted"}`}>
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl leading-none">RETIRADA</span>
              {!isOpen && <span className="text-sm text-muted-foreground leading-none">Fechado</span>}
            </div>
          </Button>

          <Button
            onClick={() => handleNavigation("/sobre")}
            className="w-full text-xl font-semibold px-3 rounded-xl flex items-center space-x-3 shadow-md transition-all duration-200 min-h-[56px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <div className="bg-white bg-opacity-20 p-2 rounded">
              <Info className="w-8 h-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl leading-none">SOBRE NÓS</span>
            </div>
          </Button>

        </div>
      </div>

      {/* Navegação inferior */}
      <BottomNavigation />
    </div>
  )
}
