"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

export function ParticleSphere() {
  const PARTICLE_COUNT = 1500 // Reduced particle count to make images more visible
  const PARTICLE_SIZE_MIN = 0.005
  const PARTICLE_SIZE_MAX = 0.010
  const SPHERE_RADIUS = 9
  const POSITION_RANDOMNESS = 4
  const ROTATION_SPEED_X = 0.0
  const ROTATION_SPEED_Y = 0.0005
  const PARTICLE_OPACITY = 1

  const IMAGE_COUNT = 24
  const IMAGE_SIZE = 1.5 // Increased image size to make them more visible

  const groupRef = useRef<THREE.Group>(null)

  const textures = useTexture([
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
    "/orbital-gallery/img-1.webp",
    "/orbital-gallery/img-2.webp",
    "/orbital-gallery/img-3.webp",
    "/orbital-gallery/img-4.webp",
    "/orbital-gallery/img-5.webp",
    "/orbital-gallery/img-6.webp",
    "/orbital-gallery/img-7.webp",
    "/orbital-gallery/img-8.webp",
    "/orbital-gallery/img-9.webp",
    "/orbital-gallery/img-10.webp",
    "/orbital-gallery/img-11.webp",
    "/orbital-gallery/img-12.webp",
    "/orbital-gallery/img-13.webp",
    "/orbital-gallery/img-14.webp",
    "/orbital-gallery/img-15.webp",
    "/orbital-gallery/img-16.webp",
    "/orbital-gallery/img-17.webp",
    "/orbital-gallery/img-18.webp",
    "/orbital-gallery/img-19.webp",
    "/orbital-gallery/img-20.webp",
    "/orbital-gallery/img-21.webp",
    "/orbital-gallery/img-22.webp",
    "/orbital-gallery/img-23.webp",
    "/orbital-gallery/img-24.webp",
    "/orbital-gallery/img-25.webp",
  ])

  // const textures = useTexture([
  //   "/orbital-gallery/img-1.webp",
  //   "/orbital-gallery/img-2.webp",
  //   "/orbital-gallery/img-3.webp",
  //   "/orbital-gallery/img-4.webp",
  //   "/orbital-gallery/img-5.webp",
  //   "/orbital-gallery/img-6.webp",
  //   "/orbital-gallery/img-7.webp",
  //   "/orbital-gallery/img-8.webp",
  //   "/orbital-gallery/img-9.webp",
  //   "/orbital-gallery/img-10.webp",
  //   "/orbital-gallery/img-11.webp",
  //   "/orbital-gallery/img-12.webp",
  //   "/orbital-gallery/img-13.webp",
  //   "/orbital-gallery/img-14.webp",
  //   "/orbital-gallery/img-15.webp",
  //   "/orbital-gallery/img-16.webp",
  //   "/orbital-gallery/img-17.webp",
  //   "/orbital-gallery/img-18.webp",
  //   "/orbital-gallery/img-19.webp",
  //   "/orbital-gallery/img-20.webp",
  //   "/orbital-gallery/img-21.webp",
  //   "/orbital-gallery/img-22.webp",
  //   "/orbital-gallery/img-23.webp",
  //   "/orbital-gallery/img-24.webp",
  //   "/orbital-gallery/img-25.webp",
  // ])

  useMemo(() => {
    textures.forEach((texture) => {
      if (texture) {
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.flipY = false

        if (texture.image) {
          const aspect = texture.image.width / texture.image.height
          if (aspect > 1) {
            // Landscape: scale texture horizontally (crop sides)
            texture.repeat.set(1 / aspect, 1)
            texture.offset.set((1 - 1 / aspect) / 2, 0)
          } else {
            // Portrait: scale texture vertically (crop top/bottom)
            texture.repeat.set(1, aspect)
            texture.offset.set(0, (1 - aspect) / 2)
          }
        }
      }
    })
  }, [textures])

  const particles = useMemo(() => {
    const particles = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Generate points on sphere surface with some random variation
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT)
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi

      // Add random variation to make it more organic
      const radiusVariation = SPHERE_RADIUS + (Math.random() - 0.5) * POSITION_RANDOMNESS

      const x = radiusVariation * Math.cos(theta) * Math.sin(phi)
      const y = radiusVariation * Math.cos(phi)
      const z = radiusVariation * Math.sin(theta) * Math.sin(phi)

      particles.push({
        position: [x, y, z] as [number, number, number],
        scale: Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN,
        color: new THREE.Color().setHSL(
          Math.random() * 0.1 + 0.05, // Yellow-orange hues
          0.8,
          0.6 + Math.random() * 0.3,
        ),
        rotationSpeed: (Math.random() - 0.5) * 0.01,
      })
    }

    return particles
  }, [PARTICLE_COUNT, SPHERE_RADIUS, POSITION_RANDOMNESS, PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX])

  const orbitingImages = useMemo(() => {
    const images = []

    for (let i = 0; i < IMAGE_COUNT; i++) {
      const angle = (i / IMAGE_COUNT) * Math.PI * 2
      const x = SPHERE_RADIUS * Math.cos(angle)
      const y = 0 // All images aligned on X-axis
      const z = SPHERE_RADIUS * Math.sin(angle)

      const position = new THREE.Vector3(x, y, z)
      const center = new THREE.Vector3(0, 0, 0)
      const outwardDirection = position.clone().sub(center).normalize()

      // Create a rotation that makes the plane face outward
      const euler = new THREE.Euler()
      const matrix = new THREE.Matrix4()
      matrix.lookAt(position, position.clone().add(outwardDirection), new THREE.Vector3(0, 1, 0))
      euler.setFromRotationMatrix(matrix)

      euler.z += Math.PI

      images.push({
        position: [x, y, z] as [number, number, number],
        rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        textureIndex: i % textures.length,
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6), // Added random colors
      })
    }

    return images
  }, [IMAGE_COUNT, SPHERE_RADIUS, textures.length])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED_Y
      groupRef.current.rotation.x += ROTATION_SPEED_X
    }
  })

  return (
    <group ref={groupRef}>
      {/* Existing particles */}
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position} scale={particle.scale}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={particle.color} transparent opacity={PARTICLE_OPACITY} />
        </mesh>
      ))}

      {orbitingImages.map((image, index) => {
        const texture = textures[image.textureIndex]

        return (
          <mesh
            key={`image-${index}`}
            position={image.position}
            rotation={image.rotation}
            scale={[IMAGE_SIZE, IMAGE_SIZE, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} opacity={1} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  )
}
