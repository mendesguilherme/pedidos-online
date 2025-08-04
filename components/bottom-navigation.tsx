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
    <div className="bg-gray-800 text-white border-t border-gray-700">
      <div className="flex justify-around items-center py-2">
        <button
          onClick={() => handleNavigation("/")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/") ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Início</span>
        </button>
        <button
          onClick={() => handleNavigation("/carrinho")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/carrinho") ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-medium">Carrinho</span>
        </button>
        <button
          onClick={() => handleNavigation("/pedidos")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/pedidos") ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs font-medium">Pedidos</span>
        </button>
        <button
          onClick={() => handleNavigation("/perfil")}
          className={`flex flex-col items-center space-y-1 p-2 rounded transition-colors ${
            isActive("/perfil") ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Perfil</span>
        </button>
      </div>
    </div>
  )
}
