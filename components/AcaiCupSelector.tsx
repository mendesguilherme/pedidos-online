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
          className={`flex items-center gap-3 border px-3 py-2 rounded-xl cursor-pointer transition hover:shadow-md ${
            selectedCup === cup.id ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="acaiCup"
            className="sr-only"
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
