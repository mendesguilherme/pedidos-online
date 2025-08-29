"use client";

import { useEffect, useState } from "react";

export default function OrdersBusyBridge() {
  const [busy, setBusy] = useState<{ open: boolean; text: string }>({
    open: false,
    text: "",
  });

  useEffect(() => {
    function afterNextPaint(fn: () => void) {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => requestAnimationFrame(fn));
      } else {
        setTimeout(fn, 16);
      }
    }

    async function handleClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;

      // Só intercepta <a> com data-busy-text
      const a = t.closest("a[href][data-busy-text]") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "#";
      const text = a.getAttribute("data-busy-text") || "Processando...";
      const delayAttr = a.getAttribute("data-busy-delay");
      const delay = Number.isFinite(Number(delayAttr)) ? Number(delayAttr) : 0;

      // impede navegação imediata
      e.preventDefault();

      // mostra overlay igual às outras abas
      setBusy({ open: true, text });

      // garante 1–2 frames antes de navegar (p/ overlay pintar)
      await new Promise<void>((r) => afterNextPaint(() => r()));

      // opcional: segurar mais um pouco se você quiser testar visual
      setTimeout(() => {
        window.location.assign(href);
      }, Math.max(0, delay));
    }

    document.addEventListener("click", handleClick, true);
    // Expor helpers globais (útil no modal "Negar")
    (window as any).__showOrdersBusy = (txt: string) => setBusy({ open: true, text: txt || "Processando..." });
    (window as any).__hideOrdersBusy = () => setBusy({ open: false, text: "" });

    return () => {
      document.removeEventListener("click", handleClick, true);
      delete (window as any).__showOrdersBusy;
      delete (window as any).__hideOrdersBusy;
    };
  }, []);

  if (!busy.open) return null;

  // === Overlay idêntico ao das outras telas ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl px-6 py-4 text-center shadow-lg">
        <p className="text-sm sm:text-base font-medium">{busy.text || "Processando..."}</p>
        <div className="mt-4 w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
