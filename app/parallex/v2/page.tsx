"use client"

import { useEffect, useRef } from "react"
import { Link as LinkIcon, Youtube } from "lucide-react"

const IMAGES = [
  "/orbital-gallery/egoist/image_1.webp",
  "/orbital-gallery/egoist/image_2.webp",
  "/orbital-gallery/egoist/image_3.webp",
  "/orbital-gallery/egoist/image_4.webp",
  "/orbital-gallery/egoist/image_5.webp",
  "/orbital-gallery/egoist/image_6.webp",
  // "/orbital-gallery/egoist/image_7.webp",
  // "/orbital-gallery/egoist/image_8.webp",
  // "/orbital-gallery/egoist/image_9.webp",
  // "/orbital-gallery/egoist/image_10.webp",
  // "/orbital-gallery/egoist/image_11.webp",
  // "/orbital-gallery/egoist/image_12.webp",
  // "/orbital-gallery/egoist/image_13.webp",
  // "/orbital-gallery/egoist/image_14.webp",
  // "/orbital-gallery/egoist/image_15.webp",
  // "/orbital-gallery/egoist/image_16.webp",
  // "/orbital-gallery/egoist/image_17.webp",
  // "/orbital-gallery/egoist/image_18.webp",
  // "/orbital-gallery/egoist/image_19.webp",
  // "/orbital-gallery/egoist/image_20.webp",
  // "/orbital-gallery/egoist/image_21.webp",
  // "/orbital-gallery/egoist/image_22.webp",
  // "/orbital-gallery/egoist/image_23.webp",
  // "/orbital-gallery/egoist/image_24.webp",
  // "/orbital-gallery/egoist/image_25.webp",
]

export default function ParallaxV2Page() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Set initial percentage attributes
    track.dataset.mouseDownAt = "0"
    track.dataset.prevPercentage = "0"
    track.dataset.percentage = "0"

    const handleOnDown = (clientX: number) => {
      track.dataset.mouseDownAt = clientX.toString()
    }

    const handleOnUp = () => {
      track.dataset.mouseDownAt = "0"
      track.dataset.prevPercentage = track.dataset.percentage || "0"
    }

    const handleOnMove = (clientX: number) => {
      if (!track.dataset.mouseDownAt || track.dataset.mouseDownAt === "0") return

      const mouseDelta = parseFloat(track.dataset.mouseDownAt) - clientX
      const maxDelta = window.innerWidth

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
          transition: background-color 400ms, border-color 400ms;
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
            className="image"
            src={src}
            draggable="false"
            alt={`Egoist Collection Image ${index + 1}`}
          />
        ))}
      </div>

      {/* Source link */}
      <a
        id="source-link"
        className="meta-link"
        href="https://camillemormal.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <LinkIcon size={16} className="text-[#5e6ad2]" />
        <span>Source</span>
      </a>

      {/* YT Link */}
      <a
        id="yt-link"
        className="meta-link"
        href="https://youtu.be/PkADl0HubMY"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Youtube size={16} className="text-[#ef5350]" />
        <span>7 min tutorial</span>
      </a>
    </div>
  )
}
