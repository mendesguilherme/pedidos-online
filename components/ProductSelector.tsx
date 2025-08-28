"use client";

import Image from "next/image";

/** Tipo genérico para seleção de produto (compatível com o antigo CupForSelector) */
export type ProductForSelector = {
  id: number;
  name: string;
  price: number;
  image: string;
  /** Campos opcionais que alguns nichos usam */
  maxToppings?: number;
  volumeMl?: number;
};

type ProductSelectorProps = {
  /** Lista vinda do seu hook useProducts() */
  products: ProductForSelector[];
  selectedProductId: number | null;
  onChange: (id: number) => void;
};

export function ProductSelector({
  products,
  selectedProductId,
  onChange,
}: ProductSelectorProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return <div className="text-xs text-gray-500">Nenhum item disponível no momento.</div>;
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <label
          key={p.id}
          className={`flex items-center gap-3 border px-3 py-2 rounded-xl cursor-pointer transition hover:shadow-md ${
            selectedProductId === p.id ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="product"
            className="sr-only"
            checked={selectedProductId === p.id}
            onChange={() => onChange(p.id)}
          />

          <div className="flex-1">
            <h3 className="text-sm font-semibold">{p.name}</h3>

            {/* Linha auxiliar opcional — só aparece se houver dados */}
            {(p.volumeMl || p.maxToppings !== undefined) && (
              <p className="text-xs text-gray-600">
                {p.volumeMl ? `${p.volumeMl}ml` : null}
                {p.volumeMl && p.maxToppings !== undefined ? " • " : null}
                {p.maxToppings !== undefined ? `até ${p.maxToppings} acompanhamentos` : null}
              </p>
            )}

            <p className="text-sm font-bold text-blue-600 mt-1">
              R$ {Number(p.price).toFixed(2).replace(".", ",")}
            </p>
          </div>

          <Image
            src={p.image}
            alt={p.name}
            width={60}
            height={60}
            className="rounded object-cover"
          />
        </label>
      ))}
    </div>
  );
}

