import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import ParticleSystem from './components/ParticleSystem'
import ControlPanel from './components/ControlPanel'
import StatsOverlay from './components/StatsOverlay'
import { useSimStore } from './store/simulation'

export const orbitRef: { current: any } = { current: null }

function OrbitController() {
  const buildMode = useSimStore((s) => s.buildMode)
  return (
    <OrbitControls
      ref={(r) => { orbitRef.current = r }}
      makeDefault
      enableDamping
      enablePan={!buildMode}
    />
  )
}

export default function App() {
  const buildMode = useSimStore((s) => s.buildMode)

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 30], fov: 60 }}
        >
          <color attach="background" args={['#050510']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <pointLight position={[-10, -5, -10]} intensity={0.4} color="#60a5fa" />
          <Stars radius={80} depth={50} count={1000} factor={3} />
          <ParticleSystem />
          <OrbitController />
        </Canvas>
        <div className="absolute top-2 left-2 pointer-events-none">
          <div className={`px-3 py-1.5 rounded text-xs font-medium backdrop-blur-sm ${
            buildMode
              ? 'bg-emerald-600/80 text-white'
              : 'bg-blue-600/80 text-white'
          }`}>
            {buildMode ? '✏️ 构建模式 — 点击元素选中，拖拽手柄移动' : '▶ 运行模式 — 观察粒子实验'
          </div>
        </div>
        <StatsOverlay />
      </div>
      <ControlPanel />
    </div>
  )
}
