"use client";

import { useEffect, useMemo, useState } from "react";

// Defina o tipo aqui para evitar importar de módulo server-only
export type CupSizeOption = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  maxToppings: number;
  volumeMl: number;
};
export type CupSizeOptionWithLimits = CupSizeOption & {
  allowedToppingIds?: number[];
  allowedAddonIds?: number[]; // [] = esconder seção; undefined = mostrar todos
  requiredCreams?: number;
  allowedCreamIds?: number[];
};
export type AcaiCup = CupSizeOption | CupSizeOptionWithLimits;

type ApiResp = { data?: AcaiCup[]; error?: string };

export function useProducts() {
  const [data, setData] = useState<AcaiCup[] | null>(null);
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
        // Ignora aborts
        if (e?.name === "AbortError") return;
        if (!ignore) setError(String(e?.message || e));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
      // em produção, pode abortar para economizar rede; em dev, evita o overlay de erro
      if (process.env.NODE_ENV === "production") {
        try { ab.abort(); } catch {}
      }
    };

  }, []);

  const indexById = useMemo(() => {
    const m = new Map<number, AcaiCup>();
    (data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [data]);

  return { data, indexById, isLoading, error };
}
