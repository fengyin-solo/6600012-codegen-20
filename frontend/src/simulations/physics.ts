import type { Particle, SimMode, SceneElement, ObstacleElement, ForceElement, SpawnElement } from '../types'

const BOUND = 12
const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

function resolveBoxCollision(
  pos: [number, number, number],
  vel: [number, number, number],
  obs: ObstacleElement,
  bounce: number,
  pRadius: number
): { pos: [number, number, number]; vel: [number, number, number] } {
  const hx = obs.size.x / 2 + pRadius
  const hy = obs.size.y / 2 + pRadius
  const hz = obs.size.z / 2 + pRadius
  const dx = pos[0] - obs.position.x
  const dy = pos[1] - obs.position.y
  const dz = pos[2] - obs.position.z

  if (Math.abs(dx) < hx && Math.abs(dy) < hy && Math.abs(dz) < hz) {
    const overlapX = hx - Math.abs(dx)
    const overlapY = hy - Math.abs(dy)
    const overlapZ = hz - Math.abs(dz)
    const minOverlap = Math.min(overlapX, overlapY, overlapZ)

    if (minOverlap === overlapX) {
      const sign = dx >= 0 ? 1 : -1
      pos[0] = obs.position.x + sign * hx
      vel[0] = -vel[0] * bounce
    } else if (minOverlap === overlapY) {
      const sign = dy >= 0 ? 1 : -1
      pos[1] = obs.position.y + sign * hy
      vel[1] = -vel[1] * bounce
    } else {
      const sign = dz >= 0 ? 1 : -1
      pos[2] = obs.position.z + sign * hz
      vel[2] = -vel[2] * bounce
    }
  }
  return { pos, vel }
}

function resolveSphereCollision(
  pos: [number, number, number],
  vel: [number, number, number],
  obs: ObstacleElement,
  bounce: number,
  pRadius: number
): { pos: [number, number, number]; vel: [number, number, number] } {
  const r = obs.size.x / 2 + pRadius
  const dx = pos[0] - obs.position.x
  const dy = pos[1] - obs.position.y
  const dz = pos[2] - obs.position.z
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (dist < r) {
    const nx = dx / (dist + 0.0001)
    const ny = dy / (dist + 0.0001)
    const nz = dz / (dist + 0.0001)
    pos[0] = obs.position.x + nx * r
    pos[1] = obs.position.y + ny * r
    pos[2] = obs.position.z + nz * r
    const dot = vel[0] * nx + vel[1] * ny + vel[2] * nz
    vel[0] = (vel[0] - 2 * dot * nx) * bounce
    vel[1] = (vel[1] - 2 * dot * ny) * bounce
    vel[2] = (vel[2] - 2 * dot * nz) * bounce
  }
  return { pos, vel }
}

function resolvePlaneCollision(
  pos: [number, number, number],
  vel: [number, number, number],
  obs: ObstacleElement,
  bounce: number,
  pRadius: number
): { pos: [number, number, number]; vel: [number, number, number] } {
  const hx = obs.size.x / 2
  const hz = obs.size.z / 2
  const thickness = Math.max(obs.size.y / 2, 0.05) + pRadius

  const dx = pos[0] - obs.position.x
  const dy = pos[1] - obs.position.y
  const dz = pos[2] - obs.position.z

  if (Math.abs(dx) < hx && Math.abs(dz) < hz && Math.abs(dy) < thickness) {
    const sign = dy >= 0 ? 1 : -1
    pos[1] = obs.position.y + sign * thickness
    vel[1] = -vel[1] * bounce
  }
  return { pos, vel }
}

export function applyObstacleCollisions(
  particles: Particle[],
  obstacles: ObstacleElement[],
  bounce: number
): Particle[] {
  return particles.map((p) => {
    let pos: [number, number, number] = [...p.position]
    let vel: [number, number, number] = [...p.velocity]

    for (const obs of obstacles) {
      if (obs.shape === 'box') {
        const res = resolveBoxCollision(pos, vel, obs, bounce, p.radius)
        pos = res.pos; vel = res.vel
      } else if (obs.shape === 'sphere') {
        const res = resolveSphereCollision(pos, vel, obs, bounce, p.radius)
        pos = res.pos; vel = res.vel
      } else if (obs.shape === 'plane') {
        const res = resolvePlaneCollision(pos, vel, obs, bounce, p.radius)
        pos = res.pos; vel = res.vel
      }
    }
    return { ...p, position: pos, velocity: vel }
  })
}

export function applyForces(
  particles: Particle[],
  forces: ForceElement[],
  dt: number
): Particle[] {
  return particles.map((p) => {
    const vel: [number, number, number] = [...p.velocity]
    const pos = p.position

    for (const f of forces) {
      const dx = f.position.x - pos[0]
      const dy = f.position.y - pos[1]
      const dz = f.position.z - pos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01

      if (f.forceType === 'attract' && dist < f.radius) {
        const falloff = (1 - dist / f.radius)
        const strength = f.strength * falloff * falloff * dt
        vel[0] += (dx / dist) * strength
        vel[1] += (dy / dist) * strength
        vel[2] += (dz / dist) * strength
      } else if (f.forceType === 'repel' && dist < f.radius) {
        const falloff = (1 - dist / f.radius)
        const strength = f.strength * falloff * falloff * dt
        vel[0] -= (dx / dist) * strength
        vel[1] -= (dy / dist) * strength
        vel[2] -= (dz / dist) * strength
      } else if (f.forceType === 'wind' && f.direction && dist < f.radius) {
        const falloff = (1 - dist / f.radius)
        const strength = f.strength * falloff * dt
        const d = f.direction
        const len = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) + 0.0001
        vel[0] += (d.x / len) * strength
        vel[1] += (d.y / len) * strength
        vel[2] += (d.z / len) * strength
      }
    }
    return { ...p, velocity: vel }
  })
}

export function emitFromSpawners(
  particles: Particle[],
  spawners: SpawnElement[],
  dt: number,
  maxParticles: number
): { particles: Particle[]; emitted: number } {
  if (spawners.length === 0) return { particles, emitted: 0 }

  const result = [...particles]
  let nextId = particles.length > 0 ? Math.max(...particles.map((p) => p.id)) + 1 : 0
  let totalEmitted = 0

  for (const s of spawners) {
    const toEmit = Math.floor(s.emissionRate * dt)
    if (toEmit <= 0) continue

    for (let i = 0; i < toEmit && result.length < maxParticles; i++) {
      result.push({
        id: nextId++,
        position: [
          s.position.x + (Math.random() - 0.5) * s.size.x,
          s.position.y + (Math.random() - 0.5) * s.size.y,
          s.position.z + (Math.random() - 0.5) * s.size.z,
        ] as [number, number, number],
        velocity: [
          s.initialVelocity.x + (Math.random() - 0.5) * 0.5,
          s.initialVelocity.y + (Math.random() - 0.5) * 0.5,
          s.initialVelocity.z + (Math.random() - 0.5) * 0.5,
        ] as [number, number, number],
        mass: 0.5 + Math.random() * 2,
        color: COLORS[nextId % COLORS.length],
        radius: 0.15 + Math.random() * 0.35,
      })
      totalEmitted++
    }
  }

  return { particles: result, emitted: totalEmitted }
}

export function applyPhysics(
  particles: Particle[],
  mode: SimMode,
  gravity: number,
  damping: number,
  bounce: number,
  attractorStrength: number,
  dt: number
): Particle[] {
  return particles.map(p => {
    const vel: [number, number, number] = [...p.velocity]
    const pos: [number, number, number] = [...p.position]

    if (mode === 'gravity') {
      vel[1] -= gravity * dt
      const dx = -pos[0], dy = -pos[1], dz = -pos[2]
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.01
      const f = attractorStrength / (dist * dist) * dt
      vel[0] += dx / dist * f
      vel[1] += dy / dist * f
      vel[2] += dz / dist * f
    } else if (mode === 'collision') {
      vel[1] -= gravity * dt
      for (const q of particles) {
        if (q.id === p.id) continue
        const dx = q.position[0] - pos[0]
        const dy = q.position[1] - pos[1]
        const dz = q.position[2] - pos[2]
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < p.radius + q.radius + 0.1) {
          const nx = dx / (dist + 0.001)
          const ny = dy / (dist + 0.001)
          const nz = dz / (dist + 0.001)
          vel[0] -= nx * 0.5
          vel[1] -= ny * 0.5
          vel[2] -= nz * 0.5
        }
      }
    } else if (mode === 'fluid') {
      const pressure = 2.0
      for (const q of particles) {
        if (q.id === p.id) continue
        const dx = q.position[0] - pos[0]
        const dy = q.position[1] - pos[1]
        const dz = q.position[2] - pos[2]
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < 2.0) {
          const h = 2.0 - dist
          const force = pressure * h * h * dt
          vel[0] -= (dx / (dist+0.001)) * force
          vel[1] -= (dy / (dist+0.001)) * force - gravity * dt * 0.3
          vel[2] -= (dz / (dist+0.001)) * force
        }
      }
      vel[1] -= gravity * dt * 0.5
    } else if (mode === 'vortex') {
      const r = Math.sqrt(pos[0]*pos[0] + pos[2]*pos[2]) + 0.01
      const omega = attractorStrength / (r + 1) * dt
      vel[0] += -pos[2] / r * omega
      vel[2] +=  pos[0] / r * omega
      vel[1] -= gravity * dt * 0.2
      vel[0] -= pos[0] / r * dt * 2
      vel[2] -= pos[2] / r * dt * 2
    }

    const d = 1 - damping
    vel[0] *= d; vel[1] *= d; vel[2] *= d

    pos[0] += vel[0] * dt * 10
    pos[1] += vel[1] * dt * 10
    pos[2] += vel[2] * dt * 10

    for (let i = 0; i < 3; i++) {
      if (pos[i] > BOUND)  { pos[i] = BOUND;  vel[i] *= -bounce }
      if (pos[i] < -BOUND) { pos[i] = -BOUND; vel[i] *= -bounce }
    }

    return { ...p, position: pos, velocity: vel }
  })
}

export function categorizeElements(elements: SceneElement[]) {
  const obstacles: ObstacleElement[] = []
  const forces: ForceElement[] = []
  const spawners: SpawnElement[] = []
  for (const el of elements) {
    if (el.type === 'obstacle') obstacles.push(el)
    else if (el.type === 'force') forces.push(el)
    else if (el.type === 'spawn') spawners.push(el)
  }
  return { obstacles, forces, spawners }
}
