// app/painel/_components/ImageUploader.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Entity = "product" | "topping" | "addon";

type Props = {
  entity: Entity;
  entityId: string;             // precisa existir (registro já salvo)
  value?: string | null;        // image_url atual
  onChange: (url: string) => void;
};

export default function ImageUploader({ entity, entityId, value, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [busy, setBusy] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file)); // preview imediato
    setBusy(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("entity", entity);
    fd.append("entityId", entityId);

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha no upload");
      onChange(json.image_url);
      setPreview(json.image_url);
    } catch (err) {
      console.error(err);
      alert("Erro no upload de imagem.");
      setPreview(value ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagem</Label>
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
          <input type="file" accept="image/*" className="hidden" onChange={handleSelect} />
          {busy ? "Enviando..." : "Selecionar imagem"}
        </label>

        {preview && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              onChange("");
              setPreview(null);
            }}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
