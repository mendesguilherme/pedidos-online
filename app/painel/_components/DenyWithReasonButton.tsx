"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

type Props = {
  orderId: string;
  className?: string;
};

export default function DenyWithReasonButton({ orderId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onConfirm() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/admin/order-action?v=json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "negar", reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha ao cancelar");
      // sucesso → fecha e recarrega a listagem
      setOpen(false);
      if (typeof window !== "undefined") window.location.reload();
    } catch (e: any) {
      setErr(e?.message || "Erro inesperado.");
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Negar pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm text-gray-700">Motivo (opcional, visível ao cliente)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="Ex.: Endereço fora da área de entrega, item indisponível, etc."
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
            >
              {loading ? "Atualizando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
