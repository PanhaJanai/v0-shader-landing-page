import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import CursorManager from "../components/CursorManager" // Import here
import "./globals.css"

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: "--font-sans", // Good practice for Tailwind v4
})

export const metadata: Metadata = {
  title: "Shaders Landing Page",
  description: "Created with v0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {/* Inject the cursor logic here */}
        <CursorManager />
        {children}
        <Analytics />
      </body>
    </html>
  )
}