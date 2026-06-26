"use client"

import { useState, useEffect, useRef } from "react"
import { Link as LinkIcon, Youtube } from "lucide-react"

const IMAGES = [
  "/orbital-gallery/egoist/image_1.webp",
  "/orbital-gallery/egoist/image_2.webp",
  "/orbital-gallery/egoist/image_3.webp",
  "/orbital-gallery/egoist/image_4.webp",
  "/orbital-gallery/egoist/image_5.webp",
  "/orbital-gallery/egoist/image_6.webp",
]

export default function ParallaxV2Page() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [expandedIndex, setExpandedIndexState] = useState<number | null>(null)
  const expandedIndexRef = useRef<number | null>(null)
  const dragOccurred = useRef(false)
  const dragStartX = useRef(0)

  const setExpandedIndex = (index: number | null) => {
    expandedIndexRef.current = index
    setExpandedIndexState(index)
    if (index !== null && trackRef.current) {
      const centerPercentage = - (index / (IMAGES.length - 1)) * 100
      trackRef.current.dataset.percentage = centerPercentage.toString()
      trackRef.current.dataset.prevPercentage = centerPercentage.toString()
      
      // Animate the track to center the selected image
      trackRef.current.animate(
        {
          transform: `translate(${centerPercentage}%, -50%)`,
        },
        { duration: 1200, fill: "forwards" }
      )
      
      // Also animate inner image positions to center
      const images = trackRef.current.getElementsByClassName("image")
      for (let i = 0; i < images.length; i++) {
        const image = images[i] as HTMLImageElement
        image.animate(
          {
            objectPosition: `${100 + centerPercentage}% center`,
          },
          { duration: 1200, fill: "forwards" }
        )
      }
    }
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Set initial percentage attributes
    track.dataset.mouseDownAt = "0"
    track.dataset.prevPercentage = "0"
    track.dataset.percentage = "0"

    const handleOnDown = (clientX: number) => {
      track.dataset.mouseDownAt = clientX.toString()
      dragOccurred.current = false
      dragStartX.current = clientX
    }

    const handleOnUp = () => {
      track.dataset.mouseDownAt = "0"
      track.dataset.prevPercentage = track.dataset.percentage || "0"
    }

    const handleOnMove = (clientX: number) => {
      if (!track.dataset.mouseDownAt || track.dataset.mouseDownAt === "0") return

      const mouseDelta = parseFloat(track.dataset.mouseDownAt) - clientX
      if (Math.abs(mouseDelta) > 5) {
        dragOccurred.current = true
      }
      
      // Compensate for 20% scale when track is minimized
      const scaleFactor = expandedIndexRef.current !== null ? 0.2 : 1
      const maxDelta = window.innerWidth * scaleFactor

      const percentage = (mouseDelta / maxDelta) * -100
      const nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage || "0") + percentage
      const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100)

      track.dataset.percentage = nextPercentage.toString()

      track.animate(
        {
          transform: `translate(${nextPercentage}%, -50%)`,
        },
        { duration: 1200, fill: "forwards" }
      )

      const images = track.getElementsByClassName("image")
      for (let i = 0; i < images.length; i++) {
        const image = images[i] as HTMLImageElement
        image.animate(
          {
            objectPosition: `${100 + nextPercentage}% center`,
          },
          { duration: 1200, fill: "forwards" }
        )
      }
    }

    const onMouseDown = (e: MouseEvent) => handleOnDown(e.clientX)
    const onTouchStart = (e: TouchEvent) => handleOnDown(e.touches[0].clientX)
    const onMouseUp = () => handleOnUp()
    const onTouchEnd = () => handleOnUp()
    const onMouseMove = (e: MouseEvent) => handleOnMove(e.clientX)
    const onTouchMove = (e: TouchEvent) => handleOnMove(e.touches[0].clientX)

    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("touchmove", onTouchMove, { passive: true })

    return () => {
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  return (
    <div className="v2-parallax-container">
      {/* Styles compiled exactly from user's provided CSS */}
      <style jsx global>{`
        .v2-parallax-container {
          height: 100vh;
          width: 100vw;
          background-color: black;
          margin: 0rem;
          overflow: hidden;
          position: relative;
        }

        #image-track {
          display: flex;
          width: max-content;
          gap: 4vmin;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(0%, -50%);
          user-select: none; /* -- Prevent image highlighting -- */
        }

        #image-track > .image {
          width: 40vmin;
          height: 56vmin;
          object-fit: cover;
          object-position: 100% center;
        }

        body.menu-toggled > .meta-link > span {
          color: rgb(30, 30, 30);
        }

        #source-link {
          bottom: 60px;
        }

        .meta-link {
          align-items: center;
          backdrop-filter: blur(3px);
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          bottom: 10px;
          box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          display: inline-flex;
          gap: 7px;
          left: 10px;
          padding: 10px 20px;
          position: fixed;
          text-decoration: none;
          transition: background-color 400ms, border-color 400ms, opacity 700ms;
          z-index: 10000;
        }

        .meta-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .meta-link > i,
        .meta-link > span {
          height: 20px;
          line-height: 20px;
        }

        .meta-link > span {
          color: white;
          font-family: "Rubik", sans-serif;
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>

      {/* Sliding Image Track Wrapper */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: expandedIndex !== null ? 40 : 20,
          transform: expandedIndex !== null ? "scale(0.2)" : "scale(1)",
          transformOrigin: "center 90%",
          transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-full h-full relative pointer-events-auto">
          {/* Image Track */}
          <div
            ref={trackRef}
            id="image-track"
            data-mouse-down-at="0"
            data-prev-percentage="0"
          >
            {IMAGES.map((src, index) => (
              <img
                key={index}
                className="image cursor-pointer"
                src={src}
                draggable="false"
                alt={`Egoist Collection Image ${index + 1}`}
                onClick={() => {
                  if (!dragOccurred.current) {
                    setExpandedIndex(index)
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Source link */}
      {/* <a
        id="source-link"
        className={`meta-link transition-opacity duration-700 ${
          expandedIndex !== null ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        href="https://camillemormal.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <LinkIcon size={16} className="text-[#5e6ad2]" />
        <span>Source</span>
      </a> */}

      {/* YT Link */}
      {/* <a
        id="yt-link"
        className={`meta-link transition-opacity duration-700 ${
          expandedIndex !== null ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        href="https://youtu.be/PkADl0HubMY"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Youtube size={16} className="text-[#ef5350]" />
        <span>7 min tutorial</span>
      </a> */}

      {/* Expanded Full-screen View */}
      <div
        className="fixed inset-0 z-30 bg-black/95 flex flex-col items-center justify-start pt-[8vh] md:pt-[10vh] px-4 md:px-8 select-none"
        style={{
          opacity: expandedIndex !== null ? 1 : 0,
          pointerEvents: expandedIndex !== null ? "auto" : "none",
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={() => setExpandedIndex(null)}
      >
        {expandedIndex !== null && (
          <div className="relative w-full max-w-[85vw] md:max-w-[70vw] flex flex-col items-center">
            {/* Caption Info (now on top of the image) */}
            <div 
              className="mb-6 md:mb-8 text-center select-none"
              style={{
                animation: "fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
              }}
            >
              <span className="font-mono text-[9px] tracking-[0.4em] text-neutral-500 uppercase block mb-2">
                EXHIBITION NO. {String(expandedIndex + 1).padStart(2, "0")}
              </span>
              <h3 className="font-sans text-xl md:text-3xl text-neutral-200 font-normal tracking-tight leading-none">
                Egoist Image {expandedIndex + 1}
              </h3>
            </div>

            {/* The Image */}
            <img
              key={expandedIndex}
              src={IMAGES[expandedIndex]}
              alt={`Egoist Collection Image ${expandedIndex + 1}`}
              className="max-w-full max-h-[50vh] object-contain rounded-[4px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] cursor-zoom-out"
              style={{
                animation: "expandImage 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            />
          </div>
        )}
      </div>

      {/* Styles for expanded transitions */}
      <style jsx global>{`
        @keyframes expandImage {
          from {
            transform: scale(0.35) translateY(80px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeInDown {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
