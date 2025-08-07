"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, ShoppingCart, FileText, User } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useOrders } from "@/context/OrderContext"

export function BottomNavigation() {
  const { itemCount } = useCart()
  const { orderCount } = useOrders()

  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (route: string) => {
    router.push(route)
  }

  const isActive = (route: string) => {
    if (route === "/" && pathname === "/") return true
    if (route !== "/" && pathname.startsWith(route)) return true
    return false
  }

  const iconSize = "w-4 h-4"
  const textSize = "text-[9px]"
  const pySize = "py-1"

  return (
    <div className="bg-primary text-primary-foreground border-t border-accent fixed bottom-0 left-0 right-0 z-50 h-[56px]">
      <div className="flex justify-between items-center h-full">

        {/* Início */}
        <button
          onClick={() => handleNavigation("/")}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
            isActive("/") 
              ? "bg-primary-foreground text-primary" 
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-medium">Início</span>
        </button>

        {/* Carrinho */}
        <button
          onClick={() => handleNavigation("/carrinho")}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
            isActive("/carrinho") 
              ? "bg-primary-foreground text-primary" 
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 mb-0.5" />
            {itemCount > 0 && (
              <span className={`absolute -top-2 -right-2 text-[10px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center ${
                isActive("/carrinho") ? "bg-primary text-white" : "bg-white text-primary"
              }`}>
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium">Carrinho</span>
        </button>

        {/* Pedidos */}
        <button
          onClick={() => handleNavigation("/pedidos")}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
            isActive("/pedidos") 
              ? "bg-primary-foreground text-primary" 
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <div className="relative">
            <FileText className="w-4 h-4 mb-0.5" />
            {orderCount > 0 && (
              <span className={`absolute -top-2 -right-2 text-[10px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center ${
                isActive("/pedidos") ? "bg-primary text-white" : "bg-white text-primary"
              }`}>
                {orderCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium">Pedidos</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => handleNavigation("/perfil")}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors ${
            isActive("/perfil") 
              ? "bg-primary-foreground text-primary" 
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-medium">Perfil</span>
        </button>

      </div>
    </div>


  )
}
