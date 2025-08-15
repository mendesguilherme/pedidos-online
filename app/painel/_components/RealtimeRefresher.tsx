"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Mantém /admin sincronizado em tempo real.
 * - Usa Realtime com JWT admin (se disponível)
 * - Cai para polling a cada 5s se o canal falhar
 */
export default function RealtimeRefresher() {
  const router = useRouter();
  const mounted = useRef(false);

  // debounce para evitar múltiplos refresh seguidos
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // polling de segurança quando o canal falhar
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPoll = () => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(() => {
      // só atualiza quando a aba está visível (economia)
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    console.info("[admin-realtime] fallback polling iniciado (5s).");
  };
  const stopPoll = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
      console.info("[admin-realtime] fallback polling parado.");
    }
  };

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const supa = getSupabaseBrowser();
    if (!supa) return;

    // Se você gerou o token admin, usamos no socket antes de inscrever
    const adminJwt = process.env.NEXT_PUBLIC_REALTIME_ADMIN_TOKEN;
    if (adminJwt) {
      try {
        supa.realtime.setAuth(adminJwt);
        console.info("[admin-realtime] setAuth(admin) aplicado.");
      } catch (e) {
        console.warn("[admin-realtime] setAuth falhou, usando anon.", e);
      }
    } else {
      console.warn(
        "[admin-realtime] NEXT_PUBLIC_REALTIME_ADMIN_TOKEN ausente — tentando com anon e habilitando fallback polling."
      );
      startPoll();
    }

    const channel = supa
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            router.refresh();
          }, 250);
        }
      )
      .subscribe((status) => {
        console.info("[admin-realtime] channel status:", status);

        // Se assinou com sucesso, podemos parar o polling
        if (status === "SUBSCRIBED") {
          stopPoll();
        }

        // Situações problemáticas -> ativa polling de segurança
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          startPoll();
        }
      });

    // cleanup
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      stopPoll();
      supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
