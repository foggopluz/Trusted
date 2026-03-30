import type { Metadata } from "next"
import "./globals.css"
import { LanguageProvider } from '@/components/LanguageContext'

export const metadata: Metadata = {
  title: "TrustNet — Verified Trust for East Africa",
  description: "Portable, cryptographically-verified trust scores backed by every financial institution. Built for freelancers and businesses across East Africa.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  )
}
