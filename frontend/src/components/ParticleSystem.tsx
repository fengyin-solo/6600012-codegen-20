import { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TransformControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import { applyPhysics, applyObstacleCollisions, applyForces, emitFromSpawners, categorizeElements } from '../simulations/physics'
import type { SceneElement, ObstacleElement, ForceElement, SpawnElement } from '../types'
import { orbitRef } from '../App'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

function ObstacleMesh({ element, selected, onClick }: {
  element: ObstacleElement
  selected: boolean
  onClick: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const { buildMode } = useSimStore()
  const rot = element.rotation || { x: 0, y: 0, z: 0 }

  const geomArgs: any[] = element.shape === 'box'
    ? [element.size.x, element.size.y, element.size.z]
    : element.shape === 'sphere'
    ? [element.size.x / 2, 24, 16]
    : [element.size.x, element.size.z]

  const GeomComp: any = element.shape === 'box'
    ? 'boxGeometry'
    : element.shape === 'sphere'
    ? 'sphereGeometry'
    : 'planeGeometry'

  return (
    <mesh
      ref={ref}
      position={[element.position.x, element.position.y, element.position.z]}
      rotation={element.shape === 'plane' ? [-Math.PI / 2 + THREE.MathUtils.degToRad(rot.x), THREE.MathUtils.degToRad(rot.y), THREE.MathUtils.degToRad(rot.z)] : [THREE.MathUtils.degToRad(rot.x), THREE.MathUtils.degToRad(rot.y), THREE.MathUtils.degToRad(rot.z)]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <GeomComp args={geomArgs} />
      <meshStandardMaterial
        color={selected ? '#fbbf24' : buildMode ? '#64748b' : '#475569'}
        transparent={buildMode}
        opacity={buildMode ? 0.7 : 0.9}
        roughness={0.6}
        metalness={0.1}
        emissive={selected ? '#fbbf24' : '#000000'}
        emissiveIntensity={selected ? 0.3 : 0}
      />
      {selected && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[ref.current?.geometry]} />
          <lineBasicMaterial attach="material" color="#ffffff" />
        </lineSegments>
      )}
    </mesh>
  )
}

function ForceMesh({ element, selected, onClick }: {
  element: ForceElement
  selected: boolean
  onClick: () => void
}) {
  const { buildMode } = useSimStore()
  const color = element.forceType === 'attract' ? '#f472b6' : element.forceType === 'repel' ? '#60a5fa' : '#34d399'
  const icon = element.forceType === 'attract' ? '吸引' : element.forceType === 'repel' ? '排斥' : '风'

  const arrowDir = element.direction || { x: 1, y: 0, z: 0 }
  const arrowLen = Math.sqrt(arrowDir.x ** 2 + arrowDir.y ** 2 + arrowDir.z ** 2) || 1

  return (
    <group
      position={[element.position.x, element.position.y, element.position.z]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <mesh>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial
          color={selected ? '#fbbf24' : color}
          emissive={selected ? '#fbbf24' : color}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[element.radius, 32, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={buildMode ? 0.1 : 0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[element.radius, 32, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={buildMode ? 0.25 : 0.08}
          wireframe
        />
      </mesh>

      {element.forceType === 'wind' && (
        <arrowHelper
          args={[
            new THREE.Vector3(arrowDir.x / arrowLen, arrowDir.y / arrowLen, arrowDir.z / arrowLen),
            new THREE.Vector3(0, 0, 0),
            2,
            color,
            0.5,
            0.3
          ]}
        />
      )}
    </group>
  )
}

function SpawnMesh({ element, selected, onClick }: {
  element: SpawnElement
  selected: boolean
  onClick: () => void
}) {
  const { buildMode } = useSimStore()
  const animRef = useRef(0)
  useFrame((_, dt) => { animRef.current += dt })

  const pulseOpacity = 0.25 + 0.15 * Math.sin(animRef.current * 3)

  return (
    <group
      position={[element.position.x, element.position.y, element.position.z]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <mesh>
        <boxGeometry args={[element.size.x, element.size.y, element.size.z]} />
        <meshBasicMaterial
          color={selected ? '#fbbf24' : '#facc15'}
          transparent
          opacity={pulseOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[element.size.x, element.size.y, element.size.z]} />
        <meshBasicMaterial
          color={selected ? '#ffffff' : '#fde047'}
          transparent
          opacity={buildMode ? 0.8 : 0.5}
          wireframe
        />
      </mesh>
    </group>
  )
}

function TransformController({ element }: { element: SceneElement }) {
  const objectRef = useRef<THREE.Object3D>(null)
  const transformRef = useRef<any>(null)
  const { camera, gl } = useThree()
  const updateElement = useSimStore((s) => s.updateElement)

  const position: [number, number, number] = [element.position.x, element.position.y, element.position.z]

  return (
    <TransformControls
      ref={transformRef}
      object={objectRef}
      camera={camera}
      domElement={gl.domElement}
      mode="translate"
      orbitControls={orbitRef.current}
      onObjectChange={() => {
        if (objectRef.current) {
          const p = objectRef.current.position
          updateElement(element.id, {
            position: { x: p.x, y: p.y, z: p.z },
          })
        }
      }}
    >
      <mesh ref={objectRef} position={position}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </TransformControls>
  )
}

export default function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore((s) => s.particles)
  const mode = useSimStore((s) => s.mode)
  const gravity = useSimStore((s) => s.gravity)
  const damping = useSimStore((s) => s.damping)
  const bounce = useSimStore((s) => s.bounce)
  const attractorStrength = useSimStore((s) => s.attractorStrength)
  const slowMotion = useSimStore((s) => s.slowMotion)
  const paused = useSimStore((s) => s.paused)
  const buildMode = useSimStore((s) => s.buildMode)
  const sceneElements = useSimStore((s) => s.sceneElements)
  const selectedElementId = useSimStore((s) => s.selectedElementId)
  const selectElement = useSimStore((s) => s.selectElement)
  const setParticles = useSimStore((s) => s.setParticles)
  const setFps = useSimStore((s) => s.setFps)
  const setTotalEnergy = useSimStore((s) => s.setTotalEnergy)

  const { obstacles, forces, spawners } = useMemo(() => categorizeElements(sceneElements), [sceneElements])

  const colorArray = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  )

  useMemo(() => {
    particles.forEach((p, i) => {
      tempColor.set(p.color)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b
    })
  }, [particles, colorArray])

  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() })
  const spawnAccumulator = useRef(0)

  useFrame((_, delta) => {
    const dt = slowMotion ? delta * 0.1 : delta

    if (!buildMode && !paused) {
      let updated = applyPhysics(particles, mode, gravity, damping, bounce, attractorStrength, dt)
      updated = applyForces(updated, forces, dt)
      updated = applyObstacleCollisions(updated, obstacles, bounce)

      spawnAccumulator.current += dt
      const { particles: emitted, emitted: emittedCount } = emitFromSpawners(
        updated,
        spawners,
        spawnAccumulator.current,
        1500
      )
      if (emittedCount > 0) spawnAccumulator.current = 0

      setParticles(emitted.length < 2000 ? emitted : emitted.slice(-1500))
      updated = emitted

      let totalEnergy = 0
      if (meshRef.current) {
        updated.forEach((p, i) => {
          if (i >= particles.length) return
          tempObject.position.set(...p.position)
          const scale = p.radius * 2
          tempObject.scale.set(scale, scale, scale)
          tempObject.updateMatrix()
          meshRef.current!.setMatrixAt(i, tempObject.matrix)
          totalEnergy += 0.5 * p.mass * (p.velocity[0] ** 2 + p.velocity[1] ** 2 + p.velocity[2] ** 2)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
      }
      setTotalEnergy(totalEnergy)
    } else if (meshRef.current) {
      particles.forEach((p, i) => {
        tempObject.position.set(...p.position)
        const scale = p.radius * 2
        tempObject.scale.set(scale, scale, scale)
        tempObject.updateMatrix()
        meshRef.current!.setMatrixAt(i, tempObject.matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }

    fpsCounter.current.frames++
    const now = performance.now()
    if (now - fpsCounter.current.lastTime > 1000) {
      setFps(fpsCounter.current.frames)
      fpsCounter.current.frames = 0
      fpsCounter.current.lastTime = now
    }
  })

  const selectedElement = selectedElementId
    ? sceneElements.find((el) => el.id === selectedElementId) || null
    : null

  return (
    <group onClick={() => buildMode && selectElement(null)}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(particles.length, 1)]}>
        <sphereGeometry args={[1, 8, 8]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        </sphereGeometry>
        <meshPhongMaterial vertexColors toneMapped={false} shininess={80} />
      </instancedMesh>

      {obstacles.map((el) => (
        <ObstacleMesh
          key={el.id}
          element={el}
          selected={selectedElementId === el.id}
          onClick={() => buildMode && selectElement(el.id)}
        />
      ))}

      {forces.map((el) => (
        <ForceMesh
          key={el.id}
          element={el}
          selected={selectedElementId === el.id}
          onClick={() => buildMode && selectElement(el.id)}
        />
      ))}

      {spawners.map((el) => (
        <SpawnMesh
          key={el.id}
          element={el}
          selected={selectedElementId === el.id}
          onClick={() => buildMode && selectElement(el.id)}
        />
      ))}

      {buildMode && selectedElement && (
        <TransformController element={selectedElement} />
      )}
    </group>
  )
}
