import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"
import BeamsBackground from "@/components/kokonutui/beams-background"
import ProfileSidebar from "@/components/profile-sidebar"

const inter = Inter({ subsets: ["latin"] })
const enableAnalytics =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  title: "Dong-Ha Shin | 신동하",
  description: "Personal website of Dong-Ha Shin",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="fixed inset-0 z-0">
            <BeamsBackground intensity="medium" />
          </div>

          <div className="relative z-10 min-h-svh">
            <div className="container flex flex-col lg:flex-row py-6 lg:py-8 gap-6 lg:gap-8">
              <ProfileSidebar />
              <main className="flex-1 min-w-0">
                <div className="glass-panel min-h-[calc(100svh-3rem)]">{children}</div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
