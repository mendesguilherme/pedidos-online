"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"

interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
}

interface ProductCardProps {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
}

export function ProductCard({ product, quantity, onQuantityChange }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, quantity + delta)
    onQuantityChange(newQuantity)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Product Image */}
          <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                <p className="text-green-600 font-bold text-lg">R$ {product.price.toFixed(2).replace(".", ",")}</p>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-1">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Expanded Description */}
            {isExpanded && <p className="text-gray-600 text-sm mb-3">{product.description}</p>}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                <span className="font-semibold text-base sm:text-lg min-w-[2rem] text-center">{quantity}</span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>

              {quantity > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="font-bold text-green-600">
                    R$ {(product.price * quantity).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
