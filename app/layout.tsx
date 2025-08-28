import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { CartProvider } from "@/context/CartContext"
import { OrderProvider } from "@/context/OrderContext"
import AuthProvider from "./providers" // ⬅️ wrapper client com <SessionProvider>

export const metadata: Metadata = {
  title: "Pedido Online - Açaí Modelo",
  description: "O melhor açaí da cidade!",
  icons: {
    icon: "/images/icon-192x192.avif",
    apple: "/images/icon-192x192.avif",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const brand = (process.env.NEXT_PUBLIC_BRAND || "acai").toLowerCase()
  const themeColor = brand === "limpeza" ? "#18B7F2" : "#6b21a8"

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-brand={brand} // controla o tema via CSS
    >
      <head>
        <meta name="theme-color" content={themeColor} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.avif" type="image/avif" />
        <link rel="apple-touch-icon" href="/icon-192x192.avif" type="image/avif" />
        {/* Em DEV, desregistra qualquer Service Worker antigo para não interferir */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then(regs => regs.forEach(r => r.unregister()))
                    .catch(() => {});
                }
              `,
            }}
          />
        )}
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>{children}</OrderProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
