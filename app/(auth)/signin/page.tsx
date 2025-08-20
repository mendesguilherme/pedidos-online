"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";

// (opcional mas recomendado em páginas de login)
export const dynamic = "force-dynamic";

function SignInInner() {
  const sp = useSearchParams();
  const err = sp.get("error");

  const errorMsg = useMemo(() => {
    if (!err) return null;
    // trata como mensagem comum p/ usuário/senha incorretos
    if (err === "CredentialsSignin" || err === "AccessDenied" || err === "CredentialsError") {
      return "Usuário ou senha inválidos. Tente novamente.";
    }
    return "Não foi possível autenticar. Tente novamente.";
  }, [err]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    await signIn("credentials", {
      username,
      password,
      redirect: true,
      callbackUrl: "/painel",
    });
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold text-center">Acesso ao Painel</h1>

      {errorMsg && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label className="text-xs text-gray-600">Usuário</Label>
          <Input name="username" autoComplete="username" className="rounded-xl" />
        </div>
        <div>
          <Label className="text-xs text-gray-600">Senha</Label>
          <Input name="password" type="password" autoComplete="current-password" className="rounded-xl" />
        </div>
        <Button type="submit" className="w-full rounded-xl">Entrar</Button>
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
