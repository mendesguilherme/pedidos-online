// components/ui/AcaiCupSelector.tsx
import Image from "next/image"
import { acaiCups } from "@/data/products"
import { CupSizeOption } from "@/data/products"

interface Props {
  selectedCup: number | null
  onChange: (id: number) => void
}

export function AcaiCupSelector({ selectedCup, onChange }: Props) {
  return (
    <div className="space-y-2">
      {acaiCups.map((cup: CupSizeOption) => (
        <label
          key={cup.id}
          className={`flex items-center border p-2 rounded-md cursor-pointer transition hover:shadow-sm ${
            selectedCup === cup.id ? "border-blue-500" : "border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="acaiCup"
            className="mr-2 accent-blue-500"
            checked={selectedCup === cup.id}
            onChange={() => onChange(cup.id)}
          />

          <div className="flex-1">
            <h3 className="text-sm font-semibold">{cup.name}</h3>
            <p className="text-xs text-gray-600">
              {cup.volumeMl}ml • até {cup.maxToppings} acompanhamentos
            </p>
            <p className="text-sm font-bold text-blue-600 mt-1">
              R$ {cup.price.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <Image
            src={cup.image}
            alt={cup.name}
            width={60}
            height={60}
            className="rounded object-cover"
          />
        </label>
      ))}
    </div>
  )
}
