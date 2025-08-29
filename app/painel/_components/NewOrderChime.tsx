"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

type Props = {
  /** Só tocar quando a aba estiver ativa (se estiver oculta, não toca) */
  onlyWhenTabActive?: boolean;
  /** Tocar apenas para pedidos com status=pendente */
  onlyStatusPendente?: boolean;
  /** Caminho do arquivo de som (em /public) */
  src?: string; // ex.: "/sons/neworder.wav"
};

declare global {
  interface Window {
    /** usado pelo toggle para forçar o desbloqueio do áudio */
    dispatchEvent: (e: Event) => boolean;
  }
}

export default function NewOrderChime({
  onlyWhenTabActive = true,
  onlyStatusPendente = true,
  src = "/sons/neworder.wav",
}: Props) {
  const enabledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  // lê e observa a preferência (localStorage) – integrada ao OrdersSoundToggle
  useEffect(() => {
    const read = () => {
      try { enabledRef.current = localStorage.getItem("ordersSoundEnabled") === "1"; } catch {}
    };
    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ordersSoundEnabled") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // cria e “desbloqueia” o <audio> no 1º gesto do usuário (ou quando o toggle mandar)
  useEffect(() => {
    const unlock = () => {
      // instancia e pré-carrega
      if (!audioRef.current) {
        const a = new Audio(src);
        a.preload = "auto";
        audioRef.current = a;
      }
      // tentativa de desbloqueio: tocar mudo rapidamente
      const a = audioRef.current!;
      a.muted = true;
      a.play().catch(() => {}).finally(() => {
        a.pause();
        a.muted = false;
        a.currentTime = 0;
      });
    };

    const onPointer = () => { unlock(); cleanup(); };
    const onKey = () => { unlock(); cleanup(); };
    const cleanup = () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };

    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    // o OrdersSoundToggle deve disparar este evento ao ligar o som
    window.addEventListener("orders-sound-unlock", unlock as any);

    return () => {
      cleanup();
      window.removeEventListener("orders-sound-unlock", unlock as any);
    };
  }, [src]);

  const play = useCallback(() => {
    if (!enabledRef.current) return;
    if (onlyWhenTabActive && document.hidden) return;

    let a = audioRef.current;
    if (!a) {
      a = new Audio(src);
      a.preload = "auto";
      audioRef.current = a;
    }
    try {
      a.currentTime = 0; // reinicia se já tiver tocado
      void a.play();
    } catch {}
  }, [src, onlyWhenTabActive]);

  // Supabase Realtime – toca no INSERT de orders (opcionalmente filtrado)
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !key) return;

    const supa = createClient(url, key, { realtime: { params: { eventsPerSecond: 3 } } });
    const filter = onlyStatusPendente ? "status=eq.pendente" : undefined;

    const ch = supa
      .channel("orders-new-chime")
      .on(
        "postgres_changes",
        { schema: "public", table: "orders", event: "INSERT", filter },
        (payload) => {
          const row: any = payload.new || {};
          if (onlyStatusPendente && row?.status !== "pendente") return;

          const id = String(row.id || "");
          if (id && seenIds.current.has(id)) return;
          if (id) {
            seenIds.current.add(id);
            if (seenIds.current.size > 200) {
              seenIds.current = new Set(Array.from(seenIds.current).slice(-100));
            }
          }

          play();
        }
      )
      .subscribe();

    return () => { supa.removeChannel(ch); };
  }, [onlyStatusPendente, play]);

  return null; // sem UI
}
