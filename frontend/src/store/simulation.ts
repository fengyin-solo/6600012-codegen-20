import { create } from 'zustand'
import type {
  SimMode,
  SimulationParams,
  Particle,
  SceneElement,
  ObstacleElement,
  ForceElement,
  SpawnElement,
  Vec3,
  ObstacleShape,
  ForceType,
} from '../types'

const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    radius: 0.15 + Math.random() * 0.35,
  }))
}

function createObstacle(shape: ObstacleShape = 'box'): ObstacleElement {
  return {
    id: uid(),
    type: 'obstacle',
    shape,
    position: { x: 0, y: 0, z: 0 },
    size: shape === 'sphere' ? { x: 3, y: 3, z: 3 } : { x: 4, y: 1, z: 4 },
    rotation: { x: 0, y: 0, z: 0 },
  }
}

function createForce(forceType: ForceType = 'attract'): ForceElement {
  return {
    id: uid(),
    type: 'force',
    forceType,
    position: { x: 0, y: 0, z: 0 },
    strength: forceType === 'wind' ? 5 : 8,
    radius: 8,
    direction: forceType === 'wind' ? { x: 1, y: 0, z: 0 } : undefined,
  }
}

function createSpawn(): SpawnElement {
  return {
    id: uid(),
    type: 'spawn',
    position: { x: 0, y: 8, z: 0 },
    size: { x: 4, y: 0.5, z: 4 },
    emissionRate: 5,
    initialVelocity: { x: 0, y: 0, z: 0 },
  }
}

interface SimStore extends SimulationParams {
  particles: Particle[]
  fps: number
  totalEnergy: number
  sceneElements: SceneElement[]
  selectedElementId: string | null
  builderTool: 'select' | 'obstacle-box' | 'obstacle-sphere' | 'obstacle-plane' | 'force-attract' | 'force-repel' | 'force-wind' | 'spawn'
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, patch: Partial<SceneElement>) => void
  removeElement: (id: string) => void
  selectElement: (id: string | null) => void
  setBuilderTool: (tool: SimStore['builderTool']) => void
  clearScene: () => void
  duplicateElement: (id: string) => void
  setParticles: (particles: Particle[]) => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  buildMode: false,
  particles: randomParticles(300),
  fps: 0,
  totalEnergy: 0,
  sceneElements: [
    { ...createObstacle('box'), position: { x: 0, y: -6, z: 0 }, size: { x: 20, y: 1, z: 20 } },
  ],
  selectedElementId: null,
  builderTool: 'select',
  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => set({ particleCount: count, particles: randomParticles(count) }),
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
  addElement: (element) =>
    set((state) => ({
      sceneElements: [...state.sceneElements, element],
      selectedElementId: element.id,
    })),
  updateElement: (id, patch) =>
    set((state) => ({
      sceneElements: state.sceneElements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as SceneElement) : el
      ),
    })),
  removeElement: (id) =>
    set((state) => ({
      sceneElements: state.sceneElements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    })),
  selectElement: (id) => set({ selectedElementId: id }),
  setBuilderTool: (tool) => {
    set({ builderTool: tool })
    if (tool !== 'select') {
      let el: SceneElement
      if (tool === 'obstacle-box') el = createObstacle('box')
      else if (tool === 'obstacle-sphere') el = createObstacle('sphere')
      else if (tool === 'obstacle-plane') el = createObstacle('plane')
      else if (tool === 'force-attract') el = createForce('attract')
      else if (tool === 'force-repel') el = createForce('repel')
      else if (tool === 'force-wind') el = createForce('wind')
      else el = createSpawn()
      get().addElement(el)
      set({ builderTool: 'select' })
    }
  },
  clearScene: () => set({ sceneElements: [], selectedElementId: null }),
  duplicateElement: (id) => {
    const el = get().sceneElements.find((e) => e.id === id)
    if (el) {
      const copy: SceneElement = {
        ...el,
        id: uid(),
        position: { x: el.position.x + 1, y: el.position.y, z: el.position.z + 1 },
      } as SceneElement
      get().addElement(copy)
    }
  },
  setParticles: (particles) => set({ particles }),
}))

export { createObstacle, createForce, createSpawn }
