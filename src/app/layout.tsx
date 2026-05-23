import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gacha World — Contas Digitais',
  description: 'Compre contas digitais com entrega imediata via PIX.',
}

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PromoPopup } from '@/components/PromoPopup'
import { getSiteSettings } from './admin/settings/actions'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const promoSettings = await getSiteSettings('promo_popup')

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        {children}
        <PromoPopup settings={promoSettings} />
        <Footer />
      </body>
    </html>
  )
}

