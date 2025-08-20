import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/admin-actions";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" }, // sem sessões em DB
  pages: {
    signIn: "/signin",
    error: "/signin", // exibe mensagens de erro na mesma tela
  },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        username: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(creds) {
        try {
          const { username, password } = z
            .object({
              username: z.string().min(1),
              password: z.string().min(1),
            })
            .parse(creds);

          // retorna null quando inválido -> NextAuth envia ?error=CredentialsSignin
          const user = await verifyAdminCredentials(username, password);
          if (!user) return null;

          // NextAuth precisa de um objeto "user" simples
          return { id: user.id, name: user.name, email: undefined };
        } catch {
          // evita lançar erro genérico (que iria para /api/auth/error)
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        (token as any).role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};
