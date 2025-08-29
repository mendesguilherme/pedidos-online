"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  orderId: string;
  className?: string;
  /** Texto mostrado no overlay global enquanto processa */
  busyText?: string; // default: "Atualizando status..."
  /** Para onde redirecionar após negar. Se não informar, dará reload na página atual. */
  redirectTo?: string;
};

export default function DenyWithReasonButton({
  orderId,
  className,
  busyText = "Atualizando status...",
  redirectTo,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const showBusy = useCallback((text?: string) => {
    if (typeof window === "undefined") return;
    const fn = (window as any).__showBusyOverlay;
    if (typeof fn === "function") fn(text || busyText);
  }, [busyText]);

  const hideBusy = useCallback(() => {
    if (typeof window === "undefined") return;
    const fn = (window as any).__hideBusyOverlay;
    if (typeof fn === "function") fn();
  }, []);

  async function onConfirm() {
    try {
      setLoading(true);
      setErr(null);
      showBusy(busyText);

      const res = await fetch("/api/admin/order-action?v=json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "negar",
          reason: String(reason || "").slice(0, 500),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Falha ao cancelar.");

      // sucesso → fecha modal e navega (mantém overlay até a navegação)
      setOpen(false);
      if (typeof window !== "undefined") {
        if (redirectTo) window.location.assign(redirectTo);
        else window.location.reload();
      }
    } catch (e: any) {
      setErr(e?.message || "Erro inesperado.");
      hideBusy(); // só escondemos o overlay em caso de erro
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        Negar Pedido
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          // evita fechar enquanto processa
          if (!loading) setOpen(next);
        }}
      >
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Negar pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="deny-reason"
              className="text-sm text-gray-700"
            >
              Motivo (opcional, visível ao cliente)
            </label>

            <textarea
              id="deny-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
              placeholder="Ex.: Endereço fora da área de entrega, item indisponível, etc."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onConfirm();
                }
              }}
            />

            {err && <p className="text-xs text-red-600">{err}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
              disabled={loading}
            >
              Voltar
            </Button>

            <Button
              type="button"
              onClick={onConfirm}
              className="rounded-xl"
              disabled={loading}
              aria-busy={loading}
              data-busy-text={busyText}
            >
              {loading ? "Atualizando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
