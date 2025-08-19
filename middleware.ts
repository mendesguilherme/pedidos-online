// middleware.ts (raiz do projeto)
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/painel/:path*"], // tudo sob /painel exige login
}
