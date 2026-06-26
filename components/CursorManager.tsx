"use client"
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function CursorManager() {
  const pathname = usePathname()

  useEffect(() => {
    // Logic: Hide on root "/" and anything starting with "/v2"
    // Everything else (like "/uniqlo") will show the cursor
    const shouldHide = pathname === "/" || pathname.startsWith("/v2")

    if (shouldHide) {
      document.body.setAttribute('data-hide-cursor', 'true')
    } else {
      document.body.removeAttribute('data-hide-cursor')
    }
  }, [pathname])

  return null // This component doesn't render anything UI-wise
}