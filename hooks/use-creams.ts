"use client";

import { useEffect, useMemo, useState } from "react";

export type Cream = { id: number; name: string; imageUrl: string };
type ApiResp = { data?: Cream[]; error?: string };

export function useCreams() {
  const [data, setData] = useState<Cream[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ab = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/creams", { signal: ab.signal, cache: "no-store" });
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

  }, []);

  const indexById = useMemo(() => {
    const m = new Map<number, Cream>();
    (data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [data]);

  return { data, indexById, isLoading, error };
}
