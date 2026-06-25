"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { GrainOverlay } from "@/components/grain-overlay"

const IMAGES = [
  "/orbital-gallery/egoist/image_1.webp",
  "/orbital-gallery/egoist/image_2.webp",
  "/orbital-gallery/egoist/image_3.webp",
  "/orbital-gallery/egoist/image_4.webp",
  "/orbital-gallery/egoist/image_5.webp",
  "/orbital-gallery/egoist/image_6.webp",
  "/orbital-gallery/egoist/image_7.webp",
  "/orbital-gallery/egoist/image_8.webp",
  "/orbital-gallery/egoist/image_9.webp",
  "/orbital-gallery/egoist/image_10.webp",
  "/orbital-gallery/egoist/image_11.webp",
  "/orbital-gallery/egoist/image_12.webp",
  "/orbital-gallery/egoist/image_13.webp",
  "/orbital-gallery/egoist/image_14.webp",
  "/orbital-gallery/egoist/image_15.webp",
  "/orbital-gallery/egoist/image_16.webp",
  "/orbital-gallery/egoist/image_17.webp",
  "/orbital-gallery/egoist/image_18.webp",
  "/orbital-gallery/egoist/image_19.webp",
  "/orbital-gallery/egoist/image_20.webp",
  "/orbital-gallery/egoist/image_21.webp",
  "/orbital-gallery/egoist/image_22.webp",
  "/orbital-gallery/egoist/image_23.webp",
  "/orbital-gallery/egoist/image_24.webp",
  "/orbital-gallery/egoist/image_25.webp",
]

const TITLES = [
  "Ethereal Whispers",
  "Silent Horizon",
  "Velvet Shadows",
  "Crimson Eclipse",
  "Obsidian Dreams",
  "Golden Solitude",
  "Glitch in Nature",
  "Monochrome Echo",
  "Abstract Flow",
  "Modern Decay",
  "Geometric Solitude",
  "Digital Nostalgia",
  "Neon Mirage",
  "Prismatic Reality",
  "Surrealist Escape",
  "Futuristic Echoes",
  "Celestial Harmony",
  "Urban Isolation",
  "Subconscious Wanderer",
  "Liquid Light",
  "Shattered Mirror",
  "Organic Structure",
  "Infinite Loop",
  "Vaporwave Sunrise",
  "Echoes of Eternity",
]

export default function ParallaxPage() {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const mouseDownAt = useRef(0)
  const prevPercentage = useRef(0)
  const percentage = useRef(0)
  const targetPercentage = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)

  // Mouse & Touch down event
  const handleDown = (clientX: number) => {
    isDragging.current = true
    mouseDownAt.current = clientX
  }

  // Mouse & Touch up event
  const handleUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    mouseDownAt.current = 0
    prevPercentage.current = targetPercentage.current
  }

  // Mouse & Touch move event
  const handleMove = (clientX: number) => {
    if (!isDragging.current || mouseDownAt.current === 0) return

    const mouseDelta = mouseDownAt.current - clientX
    // Slower and smoother: maxDelta window width * 4 (makes drag less sensitive and more controlled)
    const maxDelta = window.innerWidth * 4

    const currentDeltaPercentage = (mouseDelta / maxDelta) * -100
    const nextPercentageUnconstrained = prevPercentage.current + currentDeltaPercentage
    // Clamp the percentage between -100 and 0 so the track doesn't fly off screen
    const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100)

    targetPercentage.current = nextPercentage
  }

  useEffect(() => {
    // Event listener functions capturing current client coordinates
    const onMouseDown = (e: MouseEvent) => handleDown(e.clientX)
    const onMouseUp = () => handleUp()
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX)

    const onTouchStart = (e: TouchEvent) => handleDown(e.touches[0].clientX)
    const onTouchEnd = () => handleUp()
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)

    // Trackpad / Scrollwheel support
    const handleWheel = (e: WheelEvent) => {
      // Slower wheel scrolling
      const scrollSpeed = 0.015
      let nextPercentage = targetPercentage.current - e.deltaY * scrollSpeed
      nextPercentage = Math.max(Math.min(nextPercentage, 0), -100)

      targetPercentage.current = nextPercentage
      prevPercentage.current = nextPercentage
    }

    // Smooth Lerping Loop for Track Scroll & Image Parallax
    let animationFrameId: number
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor
    }

    const updateLoop = () => {
      // Lerp the scroll percentage towards the target for buttery smoothness
      percentage.current = lerp(percentage.current, targetPercentage.current, 0.07) // Smooth factor

      const track = trackRef.current
      if (track) {
        // Smoothly position the track
        track.style.transform = `translate(${percentage.current}%, -50%)`

        // Inner parallax: see-through window effect pivoted around each image's center-screen crossing
        const images = track.getElementsByClassName("parallex-image")
        const totalImages = IMAGES.length
        for (let i = 0; i < images.length; i++) {
          const img = images[i] as HTMLImageElement
          
          // The center scroll percentage for the i-th image
          const centerPercentage = - (i / (totalImages - 1)) * 100
          
          // Distance (delta) of current track scroll from this image's center point
          const delta = percentage.current - centerPercentage
          
          // Symmetrical offset from 50% (centered) to simulate viewport locking
          const multiplier = 1.25
          const imgPosition = Math.max(Math.min(50 + delta * multiplier, 85), 15)
          
          img.style.objectPosition = `${imgPosition}% center`
        }
      }

      // Update active title based on current percentage
      const index = Math.round((Math.abs(percentage.current) / 100) * (IMAGES.length - 1))
      setActiveIndex((prev) => {
        if (prev !== index) {
          return index
        }
        return prev
      })

      animationFrameId = requestAnimationFrame(updateLoop)
    }

    animationFrameId = requestAnimationFrame(updateLoop)

    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("mousemove", onMouseMove)

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })

    window.addEventListener("wheel", handleWheel, { passive: true })

    return () => {
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("mousemove", onMouseMove)

      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchmove", onTouchMove)

      window.removeEventListener("wheel", handleWheel)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <main className="w-full h-screen bg-black overflow-hidden relative font-sans text-white select-none">
      <GrainOverlay />

      {/* Header UI (Camille Mormal Style) */}
      <header className="fixed top-0 left-0 right-0 z-30 flex justify-between items-baseline px-6 py-6 md:px-12 md:py-8 border-b border-white/5 backdrop-blur-[2px]">
        <div className="flex flex-col">
          <span className="font-semibold uppercase tracking-[0.25em] text-[11px] font-sans text-neutral-200">
            Camille Mormal
          </span>
          <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase mt-0.5">
            Clone / Interactive Track
          </span>
        </div>

        <nav className="hidden md:flex gap-10 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          <Link href="/orbital-gallery" className="hover:text-white transition-colors duration-300">
            Orbital Scene
          </Link>
          <a href="#" className="hover:text-white transition-colors duration-300">
            Info
          </a>
          <a href="#" className="hover:text-white transition-colors duration-300">
            Contact
          </a>
        </nav>

        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Portfolio &copy;2026
        </div>
      </header>

      {/* Fading Background Active Title (Parallax context reveal) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 w-full px-6 select-none">
        <span className="font-mono text-[10px] tracking-[0.4em] text-neutral-600 uppercase block mb-3 md:mb-5">
          EXHIBITION NO. {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <h2 className="font-instrument-serif text-5xl md:text-8xl text-neutral-100 font-normal italic tracking-tight transition-all duration-700 ease-out select-none mix-blend-difference leading-none">
          {TITLES[activeIndex]}
        </h2>
      </div>

      {/* Sliding Image Track */}
      <div
        ref={trackRef}
        id="image-track"
        className="flex w-max gap-[2.25vw] md:gap-[2.5vw] absolute left-[50%] top-[55%] select-none touch-none z-20"
        style={{ transform: "translate(0%, -50%)" }}
      >
        {IMAGES.map((src, index) => (
          <div
            key={index}
            className={`flex flex-col items-start w-[41vw] sm:w-[30vw] md:w-[21vw] shrink-0 group transition-opacity duration-700 ${
              activeIndex === index ? "opacity-100 scale-[1.01]" : "opacity-45 scale-95"
            }`}
          >
            {/* Image Container */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-900 border border-white/5 rounded-[3px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-[1.03]">
              <img
                src={src}
                alt={TITLES[index]}
                className="parallex-image w-[125%] h-full object-cover select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ objectPosition: "70% center" }}
                draggable={false}
              />
            </div>

            {/* Caption Info */}
            <div className="mt-5 w-full flex justify-between items-baseline font-mono text-[10px] tracking-widest text-neutral-500 uppercase px-1">
              <span className="text-neutral-600 font-bold">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-neutral-400 group-hover:text-white transition-colors duration-300 font-medium">
                {TITLES[index]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation UI & Drag instruction (Camille Mormal Style) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 flex justify-between items-center px-6 py-6 md:px-12 md:py-8 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 border-t border-white/5 backdrop-blur-[2px]">
        <div className="flex gap-4 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Collection / Egoist</span>
        </div>

        <div className="hidden sm:block text-center text-neutral-400">
          [ Hold & Drag left-right or Scroll to explore ]
        </div>

        <div className="flex gap-4">
          <span className="text-neutral-600">Track Progress:</span>
          <span className="text-neutral-300 font-bold">
            {Math.abs(Math.round(percentage.current))}%
          </span>
        </div>
      </footer>
    </main>
  )
}
