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

  const iconSize = "w-5 h-5"
  const textSize = "text-[10px]"
  const pySize = "py-1.5"

  return (
    <div className="bg-primary text-primary-foreground border-t border-accent fixed bottom-0 left-0 right-0 z-50">
      <div className={`flex justify-around items-center transition-all duration-200 ${pySize}`}>
        <button
          onClick={() => handleNavigation("/")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/") ? "bg-primary-foreground text-primary" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <Home className={iconSize} />
          <span className={`${textSize} font-medium`}>Início</span>
        </button>

        <button
          onClick={() => handleNavigation("/carrinho")}
          className={`relative flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/carrinho") ? "bg-primary-foreground text-primary" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <div className="relative">
            <ShoppingCart className={iconSize} />
            {itemCount > 0 && (
              <span
                className={`absolute -top-2 -right-2 text-[10px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center
                  ${isActive("/carrinho") ? "bg-primary text-white" : "bg-white text-primary"}
                `}
              >
                {itemCount}
              </span>
            )}
          </div>
          <span className={`${textSize} font-medium`}>Carrinho</span>
        </button>

        <button
          onClick={() => handleNavigation("/pedidos")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/pedidos") ? "bg-primary-foreground text-primary" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <div className="relative">
            <FileText className={iconSize} />
            {orderCount > 0 && (
              <span
                className={`absolute -top-2 -right-2 text-[10px] min-w-[18px] h-[18px] px-[4px] font-bold rounded-full border border-white flex items-center justify-center
                  ${isActive("/pedidos") ? "bg-primary text-white" : "bg-white text-primary"}
                `}
              >
                {orderCount}
              </span>
            )}
          </div>

          {/* Esse span estava fora! Agora está no lugar certo */}
          <span className={`${textSize} font-medium`}>Pedidos</span>
        </button>        

        <button
          onClick={() => handleNavigation("/perfil")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/perfil") ? "bg-primary-foreground text-primary" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <User className={iconSize} />
          <span className={`${textSize} font-medium`}>Perfil</span>
        </button>
      </div>
    </div>
  )
}
