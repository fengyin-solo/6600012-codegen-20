export type SimMode = 'gravity' | 'collision' | 'fluid' | 'vortex'

export type SceneElementType = 'obstacle' | 'force' | 'spawn'
export type ObstacleShape = 'box' | 'sphere' | 'plane'
export type ForceType = 'attract' | 'repel' | 'wind'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface SceneElementBase {
  id: string
  type: SceneElementType
  position: Vec3
}

export interface ObstacleElement extends SceneElementBase {
  type: 'obstacle'
  shape: ObstacleShape
  size: Vec3
  rotation: Vec3
}

export interface ForceElement extends SceneElementBase {
  type: 'force'
  forceType: ForceType
  strength: number
  radius: number
  direction?: Vec3
}

export interface SpawnElement extends SceneElementBase {
  type: 'spawn'
  size: Vec3
  emissionRate: number
  initialVelocity: Vec3
}

export type SceneElement = ObstacleElement | ForceElement | SpawnElement

export interface Particle {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  mass: number
  color: string
  radius: number
}

export interface SimulationParams {
  mode: SimMode
  particleCount: number
  gravity: number         // -20 ~ 20
  damping: number         // 0 ~ 1
  bounce: number          // 0 ~ 1
  attractorStrength: number
  slowMotion: boolean
  paused: boolean
  buildMode: boolean
}

export interface Preset {
  id: string
  name: string
  params: Partial<SimulationParams>
}
