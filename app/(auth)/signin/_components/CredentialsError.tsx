"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

export default function CredentialsError({ className = "" }: { className?: string }) {
  const sp = useSearchParams();
  const err = sp.get("error");

  if (!err) return null;

  // mensagem "comum" para usuário/senha inválidos
  const msg =
    err === "CredentialsSignin" || err === "AccessDenied"
      ? "Usuário ou senha inválidos. Tente novamente."
      : "Não foi possível autenticar. Tente novamente.";

  return (
    <div
      role="alert"
      className={`rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      {msg}
    </div>
  );
}
