import { useSimStore } from '../store/simulation'
import type { SceneElement, Vec3, ObstacleShape, ForceType } from '../types'

const TOOL_GROUPS = [
  {
    label: '障碍物',
    tools: [
      { id: 'obstacle-box' as const, icon: '🧱', label: '方块' },
      { id: 'obstacle-sphere' as const, icon: '⚫', label: '球体' },
      { id: 'obstacle-plane' as const, icon: '📐', label: '平面' },
    ],
  },
  {
    label: '力源',
    tools: [
      { id: 'force-attract' as const, icon: '🧲', label: '吸引' },
      { id: 'force-repel' as const, icon: '💨', label: '排斥' },
      { id: 'force-wind' as const, icon: '🌬️', label: '风' },
    ],
  },
  {
    label: '出生区',
    tools: [
      { id: 'spawn' as const, icon: '💫', label: '发射器' },
    ],
  },
]

function elementLabel(el: SceneElement): string {
  if (el.type === 'obstacle') {
    const shapeMap: Record<ObstacleShape, string> = { box: '方块', sphere: '球体', plane: '平面' }
    return `障碍·${shapeMap[el.shape]}`
  }
  if (el.type === 'force') {
    const typeMap: Record<ForceType, string> = { attract: '吸引力', repel: '排斥力', wind: '风力' }
    return `力源·${typeMap[el.forceType]}`
  }
  return '出生区·发射器'
}

function elementIcon(el: SceneElement): string {
  if (el.type === 'obstacle') {
    return el.shape === 'box' ? '🧱' : el.shape === 'sphere' ? '⚫' : '📐'
  }
  if (el.type === 'force') {
    return el.forceType === 'attract' ? '🧲' : el.forceType === 'repel' ? '💨' : '🌬️'
  }
  return '💫'
}

interface Vec3InputProps {
  label: string
  value: Vec3
  onChange: (v: Vec3) => void
  step?: number
}

function Vec3Input({ label, value, onChange, step = 0.5 }: Vec3InputProps) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="flex items-center gap-1">
            <span className="text-xs text-gray-500 w-3">{axis}</span>
            <input
              type="number"
              step={step}
              value={value[axis]}
              onChange={(e) => onChange({ ...value, [axis]: Number(e.target.value) })}
              className="w-full bg-gray-800 text-white text-xs rounded px-1.5 py-1 border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  formatter?: (v: number) => string
  color?: string
}

function SliderInput({ label, value, min, max, step, onChange, formatter, color = 'blue' }: SliderInputProps) {
  const colorClass = `accent-${color}-500`
  return (
    <div>
      <label className="text-xs text-gray-400">
        {label}: {formatter ? formatter(value) : value.toFixed(2)}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${colorClass}`}
      />
    </div>
  )
}

export default function SceneBuilder() {
  const store = useSimStore()
  const selected = store.sceneElements.find((el) => el.id === store.selectedElementId) || null

  const updatePos = (v: Vec3) => selected && store.updateElement(selected.id, { position: v })
  const updateSize = (v: Vec3) => selected && store.updateElement(selected.id, { size: v } as any)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🛠️ 场景构建器</h3>
        <button
          onClick={() => store.setParam('buildMode', !store.buildMode)}
          className={`px-2 py-1 rounded text-xs font-medium transition ${
            store.buildMode ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {store.buildMode ? '✏️ 编辑中' : '▶ 运行模式'}
        </button>
      </div>

      {TOOL_GROUPS.map((group) => (
        <div key={group.label}>
          <label className="text-xs text-gray-400 block mb-1">{group.label}</label>
          <div className="grid grid-cols-3 gap-1">
            {group.tools.map((t) => (
              <button
                key={t.id}
                onClick={() => store.setBuilderTool(t.id)}
                className="flex flex-col items-center gap-0.5 px-1 py-1.5 bg-gray-700 hover:bg-blue-600 rounded text-xs text-white transition"
                title={t.label}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="text-[10px] opacity-80">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">场景元素 ({store.sceneElements.length})</label>
          <button
            onClick={() => {
              if (confirm('确定清空所有场景元素？')) store.clearScene()
            }}
            className="text-[10px] text-red-400 hover:text-red-300"
          >
            清空全部
          </button>
        </div>
        <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
          {store.sceneElements.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-3">暂无元素，点击上方按钮添加</div>
          )}
          {store.sceneElements.map((el) => (
            <div
              key={el.id}
              onClick={() => store.selectElement(el.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition ${
                store.selectedElementId === el.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{elementIcon(el)}</span>
              <span className="flex-1 truncate">{elementLabel(el)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  store.duplicateElement(el.id)
                }}
                className="opacity-60 hover:opacity-100"
                title="复制"
              >
                📋
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  store.removeElement(el.id)
                }}
                className="opacity-60 hover:opacity-100 text-red-400"
                title="删除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="border-t border-gray-700 pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-blue-400">
              {elementIcon(selected)} {elementLabel(selected)} 属性
            </label>
          </div>

          <Vec3Input label="📍 位置" value={selected.position} onChange={updatePos} step={0.5} />

          {(selected.type === 'obstacle' || selected.type === 'spawn') && (
            <Vec3Input
              label="📐 尺寸"
              value={selected.size}
              onChange={updateSize}
              step={0.5}
            />
          )}

          {selected.type === 'obstacle' && selected.shape !== 'sphere' && (
            <Vec3Input
              label="🔄 旋转 (度)"
              value={(selected as any).rotation || { x: 0, y: 0, z: 0 }}
              onChange={(v) => store.updateElement(selected.id, { rotation: v } as any)}
              step={5}
            />
          )}

          {selected.type === 'obstacle' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">形状</label>
              <div className="grid grid-cols-3 gap-1">
                {(['box', 'sphere', 'plane'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => store.updateElement(selected.id, { shape } as any)}
                    className={`px-2 py-1 text-xs rounded transition ${
                      (selected as any).shape === shape
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {shape === 'box' ? '方块' : shape === 'sphere' ? '球体' : '平面'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected.type === 'force' && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">力类型</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['attract', 'repel', 'wind'] as const).map((ft) => (
                    <button
                      key={ft}
                      onClick={() => store.updateElement(selected.id, { forceType: ft } as any)}
                      className={`px-2 py-1 text-xs rounded transition ${
                        (selected as any).forceType === ft
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {ft === 'attract' ? '吸引' : ft === 'repel' ? '排斥' : '风'}
                    </button>
                  ))}
                </div>
              </div>
              <SliderInput
                label="💪 强度"
                value={(selected as any).strength}
                min={0}
                max={30}
                step={0.5}
                onChange={(v) => store.updateElement(selected.id, { strength: v } as any)}
                color="pink"
              />
              <SliderInput
                label="📏 作用半径"
                value={(selected as any).radius}
                min={1}
                max={30}
                step={0.5}
                onChange={(v) => store.updateElement(selected.id, { radius: v } as any)}
                color="pink"
              />
              {(selected as any).forceType === 'wind' && (
                <Vec3Input
                  label="🧭 风向"
                  value={(selected as any).direction || { x: 1, y: 0, z: 0 }}
                  onChange={(v) => store.updateElement(selected.id, { direction: v } as any)}
                  step={0.1}
                />
              )}
            </>
          )}

          {selected.type === 'spawn' && (
            <>
              <SliderInput
                label="🚀 发射速率 (个/秒)"
                value={(selected as any).emissionRate}
                min={0}
                max={50}
                step={1}
                onChange={(v) => store.updateElement(selected.id, { emissionRate: v } as any)}
                formatter={(v) => v.toFixed(0)}
                color="yellow"
              />
              <Vec3Input
                label="💨 初始速度"
                value={(selected as any).initialVelocity || { x: 0, y: 0, z: 0 }}
                onChange={(v) => store.updateElement(selected.id, { initialVelocity: v } as any)}
                step={0.5}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
