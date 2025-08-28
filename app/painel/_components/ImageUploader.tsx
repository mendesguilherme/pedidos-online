// app/painel/_components/ImageUploader.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Entity = "product" | "topping" | "addon";

/**
 * onChange compatível:
 * - antigo: (url: string) => void
 * - novo  : (url: string | null, meta?: any) => void
 */
type OnChangeCompat =
  | ((url: string) => void)
  | ((url: string | null, meta?: any) => void);

type Props = {
  entity: Entity;
  /** id do registro quando já existe; opcional no modo desacoplado */
  entityId?: string | number;
  /** URL atual (image_url) */
  value?: string | null;
  /** callback resultado do upload (ou remoção) */
  onChange: OnChangeCompat;
  /**
   * Se true, não associa ao registro (não envia entityId).
   * Útil antes do POST/CREATE existir. Default: false.
   */
  detached?: boolean;
  /** Rótulo exibido acima (opcional) */
  label?: string;
};

export default function ImageUploader({
  entity,
  entityId,
  value,
  onChange,
  detached = false,
  label = "Imagem",
}: Props) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  // chamada compatível (não estoura tipos independentemente da assinatura usada)
  const emitChange = (url: string | null, meta?: any) => {
    (onChange as any)(url, meta);
  };

  const isIntLike = (v: unknown) => /^[0-9]+$/.test(String(v ?? ""));

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget; // <— capture o elemento ANTES de qualquer await
    const file = inputEl.files?.[0];
    if (!file) return;

    // preview imediato
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setBusy(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("entity", entity);

    const hasValidId = isIntLike(entityId);

    if (!detached && hasValidId) {
      // upload “acoplado”: atualiza o registro no backend
      fd.append("entityId", String(entityId));
    } else {
      // upload “desacoplado”: apenas sobe mídia e devolve URL/meta
      fd.append("mode", "detached");
      fd.append("detached", "1"); // compat extra
    }

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error || `Falha no upload (HTTP ${res.status})`;
        throw new Error(msg);
      }

      // normaliza possíveis chaves retornadas
      const nextUrl: string =
        json.image_url || json.url || json.publicUrl || json.location || "";

      const meta = json.image_meta ?? json.meta ?? null;

      if (!nextUrl) {
        throw new Error("Upload retornou sem URL pública.");
      }

      // Atualiza preview e notifica quem chama.
      setPreview(nextUrl);
      emitChange(nextUrl, meta);
    } catch (err) {
      console.error(err);
      alert("Erro no upload de imagem.");
      // volta para o estado anterior
      setPreview(value ?? null);
    } finally {
      setBusy(false);
      // limpa o objeto URL temporário
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
      // limpa o input para permitir novo mesmo arquivo (pode já ter desmontado)
      try {
        if (inputEl) inputEl.value = "";
      } catch {}
    }
  };

  const handleRemove = () => {
    // compat: quem trata entende falsy como “remover”
    emitChange("");
    setPreview(null);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="preview"
              width={64}
              height={64}
              className="object-cover h-full w-full"
            />
          ) : (
            <span className="text-xs text-muted-foreground">64×64</span>
          )}
        </div>

        <label className="inline-flex items-center rounded-xl border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelect}
            disabled={busy}
          />
          {busy ? "Enviando..." : "Selecionar imagem"}
        </label>

        {preview && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={handleRemove}
            disabled={busy}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
