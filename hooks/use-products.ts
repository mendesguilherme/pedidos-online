"use client";

import { useEffect, useMemo, useState } from "react";

/** Categoria leve retornada junto ao produto */
export type CategoryLite = {
  id: string;
  name: string;
  slug: string;
  position: number;
  active: boolean;
};

// Tipos genéricos (sem referência a nicho)
export type ProductOption = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  maxToppings: number;
  volumeMl: number;
  /** Categoria do produto (opcional para compatibilidade) */
  category?: CategoryLite | null;
};

export type ProductOptionWithLimits = ProductOption & {
  allowedToppingIds?: number[];
  allowedAddonIds?: number[]; // [] = esconder seção; undefined = mostrar todos
  requiredCreams?: number;
  allowedCreamIds?: number[];
};

export type Product = ProductOption | ProductOptionWithLimits;

type ApiResp = { data?: Product[]; error?: string };

export function useProducts() {
  const [data, setData] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ab = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/products", {
          signal: ab.signal,
          cache: "no-store",
        });
        const json: ApiResp = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

        if (!ignore) setData(json.data ?? []);
      } catch (e: any) {
        if (e?.name === "AbortError") return; // ignora aborts
        if (!ignore) setError(String(e?.message || e));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
      if (process.env.NODE_ENV === "production") {
        try { ab.abort(); } catch {}
      }
    };
  }, []);

  const indexById = useMemo(() => {
    const m = new Map<number, Product>();
    (data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [data]);

  return { data, indexById, isLoading, error };
}
