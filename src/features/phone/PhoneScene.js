import * as THREE from 'three'
import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Mask, OrthographicCamera, Clone, Float as FloatImpl } from '@react-three/drei'
import useSpline from '@splinetool/r3f-spline'

const PARTICLE_COLOR = new THREE.Color('#f59e0b')
const PARTICLE_HEX = '#f59e0b'

function isPinkishColor(c) {
  if (!c?.isColor) return false
  return c.r > 0.32 && c.b > 0.25 && c.g < Math.max(c.r, c.b) * 0.9
}

function isUnderNamedParent(obj, name) {
  let p = obj?.parent
  while (p) {
    if (p.name === name) return true
    p = p.parent
  }
  return false
}

function getNamedParent(obj, name) {
  let p = obj?.parent
  while (p) {
    if (p.name === name) return p
    p = p.parent
  }
  return null
}

function applyNoPinkMaterial(m, underPhone) {
  if (!m) return
  if (underPhone) {
    if (m.map) m.map = null
    if (m.alphaMap) m.alphaMap = null
    if (m.emissive) {
      m.emissive.setRGB(0, 0, 0)
      m.emissiveIntensity = 0
    }
    if ('transmission' in m) m.transmission = 0
    if ('thickness' in m) m.thickness = 0
    if ('clearcoat' in m) m.clearcoat = 0
    if ('iridescence' in m) m.iridescence = 0
    if ('envMapIntensity' in m) m.envMapIntensity = 0
    if ('reflectivity' in m) m.reflectivity = 0
    if (m.color) m.color.setRGB(0.12, 0.12, 0.14)
  }
  if (m.color && isPinkishColor(m.color)) {
    if (underPhone) m.color.setRGB(0.12, 0.12, 0.14)
    else m.color.copy(PARTICLE_COLOR)
  }
  if (m.type === 'ShaderMaterial' && m.uniforms) {
    for (const [key, u] of Object.entries(m.uniforms)) {
      if (!u?.value?.isColor) continue
      const glowKey = /emiss|glow|rim|neon|bloom|halo|edge|light|fresnel|specular/i.test(key)
      if (!isPinkishColor(u.value) && !glowKey) continue
      if (underPhone) u.value.setRGB(0, 0, 0)
      else u.value.copy(PARTICLE_COLOR)
    }
  }
  m.needsUpdate = true
}

function colorLooksPinkPurple(c) {
  if (!c?.isColor) return false
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  const deg = hsl.h * 360
  return hsl.s > 0.2 && deg >= 250 && deg <= 345
}

function materialHasPinkPurple(m) {
  if (!m) return false
  if (colorLooksPinkPurple(m.color) || colorLooksPinkPurple(m.emissive)) return true
  if (m.type === 'ShaderMaterial' && m.uniforms) {
    for (const u of Object.values(m.uniforms)) {
      if (colorLooksPinkPurple(u?.value)) return true
    }
  }
  return false
}

function paintDecorMaterial(m) {
  if (!m) return
  if (m.map) m.map = null
  if (m.alphaMap) m.alphaMap = null
  if (m.color) m.color.copy(PARTICLE_COLOR)
  if (m.emissive) {
    m.emissive.copy(PARTICLE_COLOR)
    m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 0.22)
  }
  if (m.type === 'ShaderMaterial' && m.uniforms) {
    for (const u of Object.values(m.uniforms)) {
      if (u?.value?.isColor) u.value.copy(PARTICLE_COLOR)
    }
  }
  m.needsUpdate = true
}

function objectMetric(o, tmp) {
  if (!o?.geometry) return 0
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
  const box = o.geometry.boundingBox
  if (!box) return 0
  return box.getSize(tmp).length()
}

function shouldHideTopPhoneAccent(o) {
  if (!o?.isMesh || !o.geometry?.boundingBox) return false
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  o.geometry.boundingBox.getSize(size)
  o.geometry.boundingBox.getCenter(center)
  // Верхняя зона телефона: мелкие/узкие объекты (полоска, точка), но не большой корпус.
  if (center.y > 160 && size.y < 40 && size.x < 220 && size.z < 60) return true
  return false
}

const _worldBox = new THREE.Box3()
const _worldCenter = new THREE.Vector3()
const _worldSize = new THREE.Vector3()

function shouldHideTopPhoneAccentInPhoneLocal(o) {
  if (!o?.isMesh) return false
  const phoneRoot = getNamedParent(o, 'phone')
  if (!phoneRoot) return false
  _worldBox.setFromObject(o)
  if (_worldBox.isEmpty()) return false
  _worldBox.getCenter(_worldCenter)
  _worldBox.getSize(_worldSize)
  const localCenter = phoneRoot.worldToLocal(_worldCenter.clone())
  // Верхняя зона телефона: мелкие/узкие меши
  return localCenter.y > 185 && _worldSize.y < 65 && _worldSize.x < 260 && _worldSize.z < 90
}

function replaceDecorMaterial(o) {
  if (o.userData?.forcedDecorMaterial) return
  const t = o.type
  if (t === 'Line' || t === 'LineSegments' || t === 'LineLoop') {
    o.material = new THREE.LineBasicMaterial({ color: PARTICLE_HEX })
    o.userData.forcedDecorMaterial = true
    return
  }
  if (o.isPoints || t === 'Points') {
    o.material = new THREE.PointsMaterial({ color: PARTICLE_HEX, size: 6, sizeAttenuation: true })
    o.userData.forcedDecorMaterial = true
    return
  }
  if (o.isMesh) {
    o.material = new THREE.MeshStandardMaterial({
      color: PARTICLE_HEX,
      emissive: PARTICLE_HEX,
      emissiveIntensity: 0.22,
      roughness: 0.5,
      metalness: 0.05,
    })
    o.userData.forcedDecorMaterial = true
  }
}

function PhoneSceneContent({ portal, children, ...props }) {
  const hand = useRef(null)
  const paintPass = useRef(0)
  const v = new THREE.Vector3()
  const baseCamera = useRef({ x: 0, y: 0, z: 1000, zoom: 0.58 })
  const tmpSize = new THREE.Vector3()

  const { nodes } = useSpline('scroll.splinecode')
  const { scene } = useThree()

  useFrame(() => {
    if (!scene?.traverse) return
    if (paintPass.current >= 70) return
    paintPass.current += 1

    scene.traverse((o) => {
      const mat = o?.material
      if (!mat) return

      const underPhone = isUnderNamedParent(o, 'phone')
      const arr = Array.isArray(mat) ? mat : [mat]
      arr.forEach((m) => applyNoPinkMaterial(m, underPhone))

      if (underPhone && o.isMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
        if (shouldHideTopPhoneAccent(o) || shouldHideTopPhoneAccentInPhoneLocal(o)) {
          o.visible = false
          return
        }
      }

      // Точный срез розовой полосы: тонкий/небольшой объект в верхней зоне телефона.
      if (underPhone && o.isMesh && o.geometry) {
        const metric = objectMetric(o, tmpSize)
        const hasPinkPurple = arr.some((m) => materialHasPinkPurple(m))
        if (hasPinkPurple && metric < 180 && o.position?.y > 160) {
          o.visible = false
          return
        }
      }

      const underHand = isUnderNamedParent(o, 'hand-l') || isUnderNamedParent(o, 'hand-r')
      const metric = objectMetric(o, tmpSize)

      // Удаляем розовую полоску вверху: обычно тонкий розовый элемент внутри phone-ветки.
      if (underPhone && metric < 420 && arr.some((m) => materialHasPinkPurple(m))) {
        o.visible = false
        return
      }

      const isDecorLike = !underPhone && !underHand && (o.isLine || o.isLineSegments || o.isPoints || o.isSprite || metric < 260)
      if (!isDecorLike) return

      // Декор вне телефона/рук форсим в единый цвет собственными материалами.
      replaceDecorMaterial(o)
    })
  })

  useFrame((state) => {
    if (!hand.current) return
    v.copy({ x: state.pointer.x, y: state.pointer.y, z: 0 })
    v.unproject(state.camera)

    hand.current.rotation.x = THREE.MathUtils.lerp(hand.current.rotation.x, -0.55, 0.2)
    hand.current.position.lerp({ x: v.x - 100, y: v.y, z: v.z }, 0.4)

    const { x, y, z, zoom } = baseCamera.current
    state.camera.zoom = THREE.MathUtils.lerp(state.camera.zoom, zoom, 0.08)
    state.camera.position.lerp({ x: x + -state.pointer.x * 220, y: y + -state.pointer.y * 120, z }, 0.08)
    state.camera.lookAt(0, 0, 0)
    state.camera.updateProjectionMatrix()
  })

  const screen = nodes?.screen
  const phonePieces = nodes?.['Rectangle 4'] && nodes?.['Rectangle 3'] && nodes?.['Boolean 2'] ? [nodes['Rectangle 4'], nodes['Rectangle 3'], nodes['Boolean 2']] : null

  return (
    <group {...props} dispose={null}>
      {nodes?.['Bg-stuff'] ? (
        <FloatImpl floatIntensity={220} rotationIntensity={0.8} speed={2}>
          <primitive object={nodes['Bg-stuff']} />
        </FloatImpl>
      ) : null}

      <group ref={hand}>
        {nodes?.['hand-r'] ? <primitive object={nodes['hand-r']} position={[0, 0, 0]} rotation={[0, 0.35, 0]} scale={[1, 1, 1]} /> : null}
      </group>

      {nodes?.['Bubble-BG'] ? <primitive object={nodes['Bubble-BG']} scale={1.25} /> : null}

      <FloatImpl floatIntensity={90} rotationIntensity={0.45} speed={1}>
        {nodes?.['Bubble-LOGO'] ? <primitive object={nodes['Bubble-LOGO']} scale={1.5} /> : null}

        <group position={[0, -50, 0]} rotation={[-0.15, 0, 0]}>
          <group position={[80, 100, -150]}>
            {nodes?.['hand-l'] ? <primitive object={nodes['hand-l']} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]} /> : null}
          </group>

          <group name="phone" position={[-50, 0, -68]}>
            {phonePieces ? <Clone object={phonePieces} /> : null}
            {screen?.geometry ? (
              <Mask id={1} colorWrite={false} depthWrite={false} geometry={screen.geometry} castShadow receiveShadow position={[0, 0, 9.89]}>
                <Html className="content-embed phone-embed" portal={portal} scale={33} transform zIndexRange={[0, 0]}>
                  {children}
                </Html>
              </Mask>
            ) : null}
          </group>
        </group>
      </FloatImpl>
    </group>
  )
}

export function PhoneScene({ children }) {
  const container = useRef(null)
  const domContent = useRef(null)

  return (
    <div ref={container} className="content-container phone-stage">
      <div ref={domContent} style={{ position: 'fixed', inset: 0, overflow: 'hidden' }} />

      <Canvas
        shadows
        flat
        linear
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: true }}
        onCreated={({ gl, scene }) => {
          scene.background = null
          gl.setClearColor(0x000000, 0)
        }}
        style={{ pointerEvents: 'auto', position: 'fixed', inset: 0 }}
        eventSource={container}
        eventPrefix="page">
        <directionalLight castShadow intensity={0.4} position={[-10, 50, 300]} shadow-mapSize={[512, 512]} shadow-bias={-0.002}>
          <orthographicCamera attach="shadow-camera" args={[-2000, 2000, 2000, -2000, -10000, 10000]} />
        </directionalLight>
        <OrthographicCamera makeDefault far={100000} near={-100000} position={[0, 0, 1000]} />
        <hemisphereLight intensity={0.5} color="#eaeaea" position={[0, 1, 0]} />

        <PhoneSceneContent portal={domContent} position={[0, -315, 0]}>
          <div className="phone-embed__inner">{children}</div>
        </PhoneSceneContent>
      </Canvas>
    </div>
  )
}
