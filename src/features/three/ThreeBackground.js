import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function useDocumentVisibility() {
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    function sync() {
      setIsRunning(document.visibilityState !== 'hidden')
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return isRunning
}

function TruckPlane() {
  const meshRef = useRef(null)
  const { viewport } = useThree()

  const textureUrl = `${process.env.PUBLIC_URL}/thumbnail.png`
  const texture = useLoader(THREE.TextureLoader, textureUrl)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const t = state.clock.elapsedTime
    const px = state.pointer.x // [-1..1]
    const py = state.pointer.y // [-1..1]

    mesh.rotation.z = Math.sin(t * 0.25) * 0.06 + px * 0.04
    mesh.rotation.y = px * 0.25 + Math.cos(t * 0.17) * 0.04
    mesh.position.x = px * 0.25
    mesh.position.y = -py * 0.18

    // Заставляем плоскость заполнять весь экран в world-units
    mesh.scale.set(viewport.width * 1.15, viewport.height * 1.15, 1)
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshStandardMaterial map={texture} transparent opacity={0.98} />
    </mesh>
  )
}

export function ThreeBackground() {
  const isRunning = useDocumentVisibility()

  return (
    <div className="bg-three" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.1], fov: 55 }}
        frameloop={isRunning ? 'always' : 'never'}
        style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2.6, 3.5, 3.5]} intensity={0.85} />
        <TruckPlane />
      </Canvas>
      <div className="bg-three__veil" />
    </div>
  )
}

