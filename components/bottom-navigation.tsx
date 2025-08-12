"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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

  // Prefetch programático (ajuda em dev e garante aquecimento)
  useEffect(() => {
    const r: any = router as any
    r?.prefetch?.("/")
    r?.prefetch?.("/carrinho")
    r?.prefetch?.("/pedidos")
    r?.prefetch?.("/perfil")
  }, [router])

  const isActive = (route: string) => {
    if (route === "/" && pathname === "/") return true
    if (route !== "/" && pathname.startsWith(route)) return true
    return false
  }

  const btnClass = (active: boolean) =>
    `flex-1 h-full flex items-center justify-center transition-colors select-none ${
      active
        ? "bg-primary-foreground text-primary"
        : "text-primary-foreground/70 md:hover:text-primary-foreground md:hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
    }`

  const innerWrap = "flex flex-col items-center justify-center h-[36px] pt-[6px]"
  const labelClass = "text-[9px] font-medium leading-none h-[10px] mt-[2px]"

  return (
    <div className="bg-primary text-primary-foreground fixed bottom-0 left-0 right-0 z-50 h-[56px]">
      <div className="flex justify-between items-center h-full">
        {/* Início */}
        {hydrated && (
          <Link
            href="/"
            prefetch
            className={btnClass(isActive("/"))}
            aria-current={isActive("/") ? "page" : undefined}
          >
            <div className={innerWrap}>
              <div className="h-4 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <span className={labelClass}>Início</span>
            </div>
          </Link>
        )}

        {/* Carrinho */}
        {hydrated && (
          <Link
            href="/carrinho"
            prefetch
            className={btnClass(isActive("/carrinho"))}
            aria-current={isActive("/carrinho") ? "page" : undefined}
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
          </Link>
        )}

        {/* Pedidos */}
        {hydrated && (
          <Link
            href="/pedidos"
            prefetch
            className={btnClass(isActive("/pedidos"))}
            aria-current={isActive("/pedidos") ? "page" : undefined}
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
          </Link>
        )}

        {/* Perfil */}
        {hydrated && (
          <Link
            href="/perfil"
            prefetch
            className={btnClass(isActive("/perfil"))}
            aria-current={isActive("/perfil") ? "page" : undefined}
          >
            <div className="h-4 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className={labelClass}>Perfil</span>
          </Link>
        )}
      </div>
    </div>
  )
}
