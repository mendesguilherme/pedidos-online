// app/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CredentialsError from "./_components/CredentialsError";

export default function SignInPage() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    await signIn("credentials", {
      username,
      password,
      redirect: true,          // NextAuth redireciona e usa ?error=... se falhar
      callbackUrl: "/painel",
    });
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center">
      <main className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-center">Acesso ao Painel</h1>

        {/* Mensagem padrão para usuário/senha inválidos */}
        <CredentialsError className="mt-4" />

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label className="text-xs text-gray-600">Usuário</Label>
            <Input name="username" autoComplete="username" className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Senha</Label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              className="rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl">
            Entrar
          </Button>
        </form>
      </main>
    </div>
  );
}
