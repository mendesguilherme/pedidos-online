import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs" // garante Node (necessário p/ bcrypt)
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
