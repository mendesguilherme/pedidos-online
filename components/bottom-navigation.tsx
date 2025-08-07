"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Home, ShoppingCart, FileText, User } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useOrders } from "@/context/OrderContext"

export function BottomNavigation() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const { itemCount } = useCart()
  const { orderCount } = useOrders()

  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (route: string) => router.push(route)

  const isActive = (route: string) => {
    if (route === "/" && pathname === "/") return true
    if (route !== "/" && pathname.startsWith(route)) return true
    return false
  }

  const btnClass = (active: boolean) =>
    `flex-1 h-full flex items-center justify-center transition-colors select-none ${
      active
        ? "bg-primary-foreground text-primary"
        : // hover só em telas >= md (desktop) + feedback de toque com active
          "text-primary-foreground/70 md:hover:text-primary-foreground md:hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
    }`


  // ↑ aumentei altura e removi overflow-hidden; padding-top cria “folga” pro badge
  const innerWrap = "flex flex-col items-center justify-center h-[36px] pt-[6px]"
  const labelClass = "text-[9px] font-medium leading-none h-[10px] mt-[2px]"

  return (
    <div className="bg-primary text-primary-foreground fixed bottom-0 left-0 right-0 z-50 h-[56px]">
      <div className="flex justify-between items-center h-full">

        {/* Início */}
        {hydrated && (
          <button
            onClick={() => handleNavigation("/")}
            className={btnClass(isActive("/"))}
          >
            <div className={innerWrap}>
              <div className="h-4 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <span className={labelClass}>Início</span>
            </div>
          </button>
        )}

        {/* Carrinho */}
        <button
          onClick={() => handleNavigation("/carrinho")}
          className={btnClass(isActive("/carrinho"))}
        >
          <div className={innerWrap}>
            <div className="relative h-4 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span
                  className={`absolute -top-2 -right-2 text-[9px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center ${
                    isActive("/carrinho") ? "bg-primary text-white" : "bg-white text-primary"
                  }`}
                >
                  {itemCount}
                </span>
              )}
            </div>
            <span className={labelClass}>Carrinho</span>
          </div>
        </button>

        {/* Pedidos */}
        <button
          onClick={() => handleNavigation("/pedidos")}
          className={btnClass(isActive("/pedidos"))}
        >
          <div className={innerWrap}>
            <div className="relative h-4 flex items-center justify-center">
              <FileText className="w-4 h-4" />
              {orderCount > 0 && (
                <span
                  className={`absolute -top-2 -right-2 text-[9px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center ${
                    isActive("/pedidos") ? "bg-primary text-white" : "bg-white text-primary"
                  }`}
                >
                  {orderCount}
                </span>
              )}
            </div>
            <span className={labelClass}>Pedidos</span>
          </div>
        </button>

        {/* Perfil */}
        <button
          onClick={() => handleNavigation("/perfil")}
          className={btnClass(isActive("/perfil"))}
        >
          <div className={innerWrap}>
            <div className="h-4 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className={labelClass}>Perfil</span>
          </div>
        </button>

      </div>
    </div>
  )
}
