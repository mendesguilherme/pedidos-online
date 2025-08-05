"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, ShoppingCart, FileText, User } from "lucide-react"

export function BottomNavigation() {
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

  return (
    <div className="bg-primary text-primary-foreground border-t border-accent fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center py-2">
        <button
          onClick={() => handleNavigation("/")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/")
              ? "bg-primary-foreground text-primary"
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Início</span>
        </button>
        <button
          onClick={() => handleNavigation("/carrinho")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/carrinho")
              ? "bg-primary-foreground text-primary"
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-medium">Carrinho</span>
        </button>
        <button
          onClick={() => handleNavigation("/pedidos")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/pedidos")
              ? "bg-primary-foreground text-primary"
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs font-medium">Pedidos</span>
        </button>
        <button
          onClick={() => handleNavigation("/perfil")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/perfil")
              ? "bg-primary-foreground text-primary"
              : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Perfil</span>
        </button>
      </div>
    </div>
  )
}
