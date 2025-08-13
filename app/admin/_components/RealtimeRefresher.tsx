"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function RealtimeRefresher() {
  const router = useRouter();
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const supa = getSupabaseBrowser();

    const channel = supa
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // debounce pra evitar múltiplos refresh em burst
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            router.refresh();
          }, 250);
        }
      )
      .subscribe((status) => {
        console.log("[realtime] channel status:", status);
      });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
