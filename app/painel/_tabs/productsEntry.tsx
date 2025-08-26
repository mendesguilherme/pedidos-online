// app/painel/_tabs/productsEntry.tsx
"use client"

import dynamic from "next/dynamic"
import ImageUploader from "../_components/ImageUploader"

// carrega a aba sob demanda no cliente e permite props soltas (any)
const ProductsTabs = dynamic<any>(() => import("./productsTabs"), { ssr: false })

export default function ProductsEntry() {
  // injeta o ImageUploader para uso dentro de productsTabs
  return <ProductsTabs ImageUploader={ImageUploader} />
}
