"use client";

import dynamic from "next/dynamic";

// carrega a aba sob demanda no cliente
const AddonsTabs = dynamic(() => import("./addonsTabs"), { ssr: false });

export default function AddonsEntry() {
  return <AddonsTabs />;
}
