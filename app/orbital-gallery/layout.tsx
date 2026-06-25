import type React from "react"
import { Instrument_Sans, Instrument_Serif } from "next/font/google"
import { Suspense } from "react"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
})

export default function GalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`${instrumentSans.variable} ${instrumentSerif.variable} min-h-screen bg-black`}>
      <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading cosmos...</div>}>
        {children}
      </Suspense>
    </div>
  )
}
