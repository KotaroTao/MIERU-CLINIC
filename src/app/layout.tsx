import type { Metadata } from "next"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"

export const metadata: Metadata = {
  title: "MIERU Clinic | 患者体験の見える化",
  description:
    "医療機関専用 患者体験改善プラットフォーム。アンケートで患者体験を可視化し、医院の改善と成長を支援します。",
  keywords: ["歯科", "患者体験", "アンケート", "患者満足度", "MIERU Clinic"],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "MIERU Clinic",
    title: "MIERU Clinic | 患者体験の見える化",
    description:
      "医療機関専用 患者体験改善プラットフォーム。アンケートで患者体験を可視化し、医院の改善と成長を支援します。",
  },
  twitter: {
    card: "summary",
    title: "MIERU Clinic | 患者体験の見える化",
    description:
      "医療機関専用 患者体験改善プラットフォーム。アンケートで患者体験を可視化し、医院の改善と成長を支援します。",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
