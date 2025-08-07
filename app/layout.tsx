import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { CartProvider } from "@/context/CartContext"
import { OrderProvider } from "@/context/OrderContext"

export const metadata: Metadata = {
  title: 'Pedido Online - Açaí do Chef',
  description: 'O melhor açaí da cidade!',
  icons: {
    icon: '/images/icon-192x192.avif',
    apple: '/images/icon-192x192.avif'
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#6b21a8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.avif" type="image/avif" />
        <link rel="apple-touch-icon" href="/icon-192x192.avif" type="image/avif" />
      </head>
      <body>
        <CartProvider>
          <OrderProvider>
            {children}
          </OrderProvider>
        </CartProvider>
      </body>
    </html>
  )
}
