// app/painel/_tabs/toppingsEntry.tsx
"use client";

import dynamic from "next/dynamic";
import ImageUploader from "../_components/ImageUploader";

// Carrega as abas no cliente e permite props soltas (any) para não travar o TS
const ToppingsTabs = dynamic<any>(() => import("./toppingsTabs"), { ssr: false });

export default function ToppingsEntry() {
  // Injeta o ImageUploader para ser usado dentro do toppingsTabs quando editar um item
  return <ToppingsTabs ImageUploader={ImageUploader} />;
}
