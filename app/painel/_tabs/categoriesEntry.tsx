"use client";

import dynamic from "next/dynamic";

// carrega a aba sob demanda no cliente
const CategoriesTabs = dynamic(() => import("./categoriesTabs"), { ssr: false });

export default function CategoriesEntry() {
  return <CategoriesTabs />;
}
