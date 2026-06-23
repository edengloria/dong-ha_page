import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import Script from "next/script"
import { profile } from "@/content/profile"
import { siteConfig } from "@/content/site"
import { withBasePath } from "@/lib/utils"
import { SiteShell } from "@/components/layout/site-shell"

const manrope = Manrope({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
})
const enableAnalytics =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.title,
  authors: [{ name: profile.name }],
  creator: profile.name,
  keywords: [...siteConfig.keywords],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.title,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: withBasePath(siteConfig.ogImage),
        alt: profile.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [withBasePath(siteConfig.ogImage)],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {enableAnalytics && gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body className={`${manrope.className} ${manrope.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
