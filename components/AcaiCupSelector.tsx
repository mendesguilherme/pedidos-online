// components/ui/AcaiCupSelector.tsx
import Image from "next/image"
import { useState } from "react"
import { acaiCups } from "@/data/products"
import { CupSizeOption } from "@/data/products"

interface Props {
  selectedCup: number | null
  onChange: (id: number) => void
}

export function AcaiCupSelector({ selectedCup, onChange }: Props) {
  return (
    <div className="space-y-4">
      {acaiCups.map((cup: CupSizeOption) => (
        <label
          key={cup.id}
          className={`flex items-center border p-3 rounded-lg cursor-pointer transition hover:shadow-md ${
            selectedCup === cup.id ? "border-blue-500" : "border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="acaiCup"
            className="mr-3 accent-blue-500"
            checked={selectedCup === cup.id}
            onChange={() => onChange(cup.id)}
          />

          <div className="flex-1">
            <h3 className="text-md font-semibold">{cup.name}</h3>
            <p className="text-sm text-gray-600">
              {cup.volumeMl}ml • até {cup.maxToppings} acompanhamentos
            </p>
            <p className="text-md font-bold text-blue-600 mt-1">
              R$ {cup.price.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <Image
            src={cup.image}
            alt={cup.name}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        </label>
      ))}
    </div>
  )
}
