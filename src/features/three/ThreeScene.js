import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function TruckPlane() {
  const ref = useRef(null)

  const texture = useMemo(() => {
    // ВАЖНО: чтобы это работало в CRA-билде, файл должен быть в /public/thumbnail.png
    // Сейчас он лежит в корне проекта — дальше я аккуратно скопирую его в public.
    const url = `${process.env.PUBLIC_URL}/thumbnail.png`
    const t = new THREE.TextureLoader().load(url)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.25) * 0.06
    mesh.rotation.y += 0.0025
  })

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <planeGeometry args={[2.2, 1.2, 1, 1]} />
      <meshStandardMaterial map={texture} transparent opacity={0.98} />
    </mesh>
  )
}

export default function ThreeScene() {
  return (
    <div className="three-wrap" aria-label="3D сцена">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.1], fov: 55 }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 3, 4]} intensity={0.85} />
        <TruckPlane />
      </Canvas>
      <div className="three-hint">
        <div className="three-hint__title">Three.js</div>
        <div className="three-hint__text">Плоскость с текстурой + лёгкая анимация, dpr адаптирован под производительность.</div>
      </div>
    </div>
  )
}

