"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

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

  /** Produto ativo para customização (apenas destaca o cartão) */
  selectedProductId: number | null;

  /** Define qual produto fica ativo para toppings/adicionais */
  onChange: (id: number) => void;

  /** Quantidades escolhidas (seleção múltipla) */
  quantities: Record<number, number>;

  /** Atualiza a quantidade de um produto */
  onQuantityChange: (id: number, qty: number) => void;

  /** Desabilitar controles (ex.: loja fechada) */
  disabled?: boolean;
};

export function ProductSelector({
  products,
  selectedProductId,
  onChange,
  quantities,
  onQuantityChange,
  disabled = false,
}: ProductSelectorProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return <div className="text-xs text-gray-500">Nenhum item disponível no momento.</div>;
  }

  return (
    <div className="space-y-2">
      {products.map((p) => {
        const qty = quantities[p.id] ?? 0;

        return (
          <div
            key={p.id}
            role="button"
            onClick={() => onChange(p.id)}
            className={`flex items-center gap-3 border px-3 py-2 rounded-xl cursor-pointer transition hover:shadow-md ${
              selectedProductId === p.id
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-300"
            }`}
          >
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

            {/* Controle de quantidade (mesmo padrão do carrinho) */}
            <div className="ml-2">
              <div
                className={`inline-flex items-center rounded-xl border px-3 py-2 gap-4 ${
                  disabled ? "opacity-40 pointer-events-none" : ""
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    qty <= 1 ? onQuantityChange(p.id, 0) : onQuantityChange(p.id, qty - 1)
                  }
                  className="p-1"
                  aria-label={qty <= 1 ? "Remover item" : "Diminuir quantidade"}
                  title={qty <= 1 ? "Remover item" : "Diminuir quantidade"}
                  disabled={disabled}
                >
                  {qty <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>

                <span className="min-w-[2ch] text-center">{qty}</span>

                <button
                  onClick={() => onQuantityChange(p.id, qty + 1)}
                  className="p-1"
                  aria-label="Aumentar quantidade"
                  title="Aumentar quantidade"
                  disabled={disabled}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
