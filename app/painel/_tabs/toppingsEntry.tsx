// app/painel/_tabs/toppingsEntry.tsx
"use client";

import dynamic from "next/dynamic";

// carrega a aba sob demanda no cliente
const ToppingsTabs = dynamic(() => import("./toppingsTabs"), { ssr: false });

export default function ToppingsEntry() {
  return <ToppingsTabs />;
}
