"use client";

import { useEffect, useMemo, useState } from "react";

export type Topping = { id: number; name: string; imageUrl: string };
type ApiResp = { data?: Topping[]; error?: string };

/** allowedIds é opcional; quando informado, a API já filtra no backend */
export function useToppings(allowedIds?: number[]) {
  const [data, setData] = useState<Topping[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const idsKey = Array.isArray(allowedIds) ? allowedIds.join(",") : "";

  useEffect(() => {
    const ab = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        setData(null);

        const qs = idsKey ? `?ids=${idsKey}` : "";
        const res = await fetch(`/api/toppings${qs}`, { signal: ab.signal, cache: "no-store" });
        const json: ApiResp = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

        if (!ignore) setData(json.data ?? []);
      } catch (e: any) {
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
  }, [idsKey]);

  const indexById = useMemo(() => {
    const m = new Map<number, Topping>();
    (data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  return { data, indexById, isLoading, error };
}
