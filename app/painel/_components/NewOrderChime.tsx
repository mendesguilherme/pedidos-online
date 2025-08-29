// app/painel/_components/NewOrderChime.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Props = {
  /** Tocar só quando a aba estiver ativa (evita susto em abas no background). Default: true */
  onlyWhenTabActive?: boolean;
  /** Tocar apenas quando o pedido entrar com status="pendente". Default: true */
  onlyStatusPendente?: boolean;
};

declare global {
  interface Window {
    __ordersAudioCtx?: AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function NewOrderChime({
  onlyWhenTabActive = true,
  onlyStatusPendente = true,
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Lê preferência
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem("ordersSoundEnabled") === "1");
    } catch {}
  }, []);

  // Sincroniza preferência entre abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ordersSoundEnabled") setEnabled(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Cria/reutiliza e tenta "resumir" o AudioContext
  const unlockCtx = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    let ctx = window.__ordersAudioCtx ?? ctxRef.current ?? null;
    if (!ctx) {
      try {
        ctx = new Ctx();
      } catch {
        return null;
      }
      window.__ordersAudioCtx = ctx;
      ctxRef.current = ctx;
    }
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    return ctx;
  }, []);

  // Desbloqueia no primeiro gesto do usuário e quando o toggle dispara o evento custom
  useEffect(() => {
    const handler = () => {
      void unlockCtx();
    };
    const onPointer = () => {
      handler();
      cleanup();
    };
    const onKey = () => {
      handler();
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("orders-sound-unlock", handler as any);
    return () => {
      cleanup();
      window.removeEventListener("orders-sound-unlock", handler as any);
    };
  }, [unlockCtx]);

  // Beep curtinho
  const beep = useCallback(
    async (freq = 987, duration = 0.28) => {
      const ctx = await unlockCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    },
    [unlockCtx]
  );

  // Supabase Realtime: toca ao inserir pedido
  useEffect(() => {
    if (!enabled) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!url || !key) return;

    const supa: SupabaseClient = createClient(url, key, {
      realtime: { params: { eventsPerSecond: 3 } },
    });

    const changesOpts: any = {
      schema: "public",
      table: "orders",
      event: "INSERT",
    };
    // Algumas versões do supabase-js ignoram silently se 'filter' não existir
    if (onlyStatusPendente) {
      changesOpts.filter = "status=eq.pendente";
    }

    const channel = supa
      .channel("orders-new-chime")
      .on("postgres_changes", changesOpts, (payload) => {
        const row: any = payload?.new ?? {};

        if (onlyWhenTabActive && document.hidden) return;
        if (onlyStatusPendente && row?.status !== "pendente") return;

        // Dedup simples (evita toques repetidos em reconexões)
        const id = String(row?.id ?? "");
        if (id) {
          const seen = seenIdsRef.current;
          if (seen.has(id)) return;
          seen.add(id);
          if (seen.size > 200) {
            seenIdsRef.current = new Set(Array.from(seen).slice(-100));
          }
        }

        void beep();
      })
      .subscribe();

    return () => {
      supa.removeChannel(channel);
    };
  }, [enabled, beep, onlyWhenTabActive, onlyStatusPendente]);

  return null; // sem UI
}
