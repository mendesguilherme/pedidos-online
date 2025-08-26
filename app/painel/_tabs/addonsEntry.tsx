// app/painel/_tabs/addonsEntry.tsx
"use client";

import dynamic from "next/dynamic";
import ImageUploader from "../_components/ImageUploader";

// Carrega a aba no cliente e permite props soltas (any) para não travar o TS
const AddonsTabs = dynamic<any>(() => import("./addonsTabs"), { ssr: false });

export default function AddonsEntry() {
  // Injeta o ImageUploader para ser usado dentro do addonsTabs quando editar um item
  return <AddonsTabs ImageUploader={ImageUploader} />;
}
