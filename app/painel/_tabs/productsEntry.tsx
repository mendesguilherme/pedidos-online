// app/painel/_tabs/productsEntry.tsx
"use client"

import dynamic from "next/dynamic"

// carrega a aba sob demanda no cliente
const ProductsTabs = dynamic(() => import("./productsTabs"), { ssr: false })

export default function ProductsEntry() {
  return <ProductsTabs />
}
