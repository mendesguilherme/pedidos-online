"use client";

import { useEffect, useMemo, useState } from "react";

export type Addon = { id: number; name: string; price: number; imageUrl: string; isActive?: boolean };
type ApiResp = { data?: Addon[]; error?: string };

export function useAddons() {
  const [data, setData] = useState<Addon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ab = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/addons", { signal: ab.signal, cache: "no-store" });
        const json: ApiResp = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

        if (!ignore) setData((json.data ?? []).filter(a => a.isActive ?? true));
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
    const m = new Map<number, Addon>();
    (data ?? []).forEach((a) => m.set(a.id, a));
    return m;
  }, [data]);

  return { data, indexById, isLoading, error };
}
