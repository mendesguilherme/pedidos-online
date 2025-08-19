import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { verifyAdminCredentials } from "@/lib/admin-actions"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" }, // sem sessões em DB
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        username: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(creds) {
        const parsed = z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        }).safeParse(creds)
        if (!parsed.success) return null
        return await verifyAdminCredentials(parsed.data.username, parsed.data.password)
      },
    }),
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id
        ;(token as any).role = "admin"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role
      }
      return session
    },
  },
}
