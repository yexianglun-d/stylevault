import type { DesignStyle, PreviewConfig } from '../types/style'

/**
 * 参数化层：把离散的 34 种风格升级为「连续可调的参数空间」。
 * 不修改 styles.ts 现有数据结构，而是叠加一组 overrides，
 * 通过 resolvePreviewConfig 生成新的 previewConfig 驱动预览，
 * 并通过 tunePromptAddon / tuneCssVariables 产出对应的文案与变量。
 */

export interface ParametricOverrides {
  radius: number
  accentHue: number
  accentSat: number
  shadowPower: number
}

export interface ParamControl {
  key: keyof ParametricOverrides
  label: string
  dimension: string
  min: number
  max: number
  step: number
  unit: string
  hint: string
}

export const PARAM_CONTROLS: ParamControl[] = [
  { key: 'radius', label: '圆角', dimension: '形状', min: 0, max: 48, step: 1, unit: 'px', hint: '圆角越大越柔和，越小越克制' },
  { key: 'accentHue', label: '主色相', dimension: '色彩', min: -180, max: 180, step: 5, unit: '°', hint: '相对风格主色旋转色相' },
  { key: 'accentSat', label: '主色饱和度', dimension: '色彩', min: -60, max: 60, step: 5, unit: '%', hint: '相对风格主色增减饱和度' },
  { key: 'shadowPower', label: '阴影强度', dimension: '光影', min: 0.4, max: 2.2, step: 0.1, unit: '×', hint: '1× 为风格原始阴影强度' },
]

/** 按 override key 索引，方便模板 `v-for="(cfg, key) in PARAM_RANGES"` 直接拿到 key 绑定。 */
export const PARAM_RANGES: Record<keyof ParametricOverrides, ParamControl> = PARAM_CONTROLS.reduce(
  (acc, cfg) => {
    acc[cfg.key] = cfg
    return acc
  },
  {} as Record<keyof ParametricOverrides, ParamControl>,
)

export function defaultOverrides(style: DesignStyle): ParametricOverrides {
  const radiusNum = parseInt(style.previewConfig.radius, 10)
  return {
    radius: Number.isFinite(radiusNum) ? radiusNum : 0,
    accentHue: 0,
    accentSat: 0,
    shadowPower: 1,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length === 8) h = h.slice(0, 6)
  const num = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(num)) return [0, 0, 0]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function shiftAccent(hex: string, hueDelta: number, satDelta: number): string {
  if (!hex || (hueDelta === 0 && satDelta === 0)) return hex
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const ns = clamp(s + satDelta / 100, 0, 1)
  const nh = (h + hueDelta + 360) % 360
  return rgbToHex(...hslToRgb(nh, ns, l))
}

function scaleShadow(shadow: string, power: number): string {
  if (!shadow || shadow.trim() === 'none') return shadow
  return shadow
    .split(',')
    .map((layer) => {
      const colorMatch = layer.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/)
      let lengthPart = layer
      let colorPart = ''
      if (colorMatch && colorMatch.index !== undefined) {
        lengthPart = layer.slice(0, colorMatch.index)
        colorPart = layer.slice(colorMatch.index)
      }
      const scaled = lengthPart.replace(/(-?\d*\.?\d+)(px)?/g, (_match, num: string, unit: string) => {
        const v = parseFloat(num)
        const nv = v * power
        return unit ? `${nv}${unit}` : `${nv}`
      })
      return scaled + colorPart
    })
    .join(',')
}

export function resolvePreviewConfig(style: DesignStyle, o: ParametricOverrides): PreviewConfig {
  const base = style.previewConfig
  return {
    ...base,
    radius: `${o.radius}px`,
    accent: shiftAccent(base.accent, o.accentHue, o.accentSat),
    shadow: scaleShadow(base.shadow, o.shadowPower),
  }
}

export function tuneCssVariables(style: DesignStyle, o: ParametricOverrides): Record<string, string> {
  const resolved = resolvePreviewConfig(style, o)
  const next: Record<string, string> = { ...style.cssVariables }
  for (const key of Object.keys(next)) {
    const lower = key.toLowerCase()
    if (lower.includes('radius')) next[key] = `${o.radius}px`
    else if (lower.includes('accent')) next[key] = resolved.accent
  }
  return next
}

export function tunePromptAddon(style: DesignStyle, o: ParametricOverrides): string {
  const parts: string[] = []
  const base = style.previewConfig
  const baseRadius = parseInt(base.radius, 10) || 0
  if (Math.abs(o.radius - baseRadius) >= 1) {
    parts.push(`圆角调整为 ${o.radius}px（原 ${baseRadius}px）`)
  }
  if (Math.abs(o.accentHue) >= 5 || Math.abs(o.accentSat) >= 5) {
    const resolved = resolvePreviewConfig(style, o)
    const detail: string[] = []
    if (Math.abs(o.accentHue) >= 5) detail.push(`色相偏移 ${o.accentHue}°`)
    if (Math.abs(o.accentSat) >= 5) detail.push(`饱和度 ${o.accentSat > 0 ? '+' : ''}${o.accentSat}%`)
    parts.push(`主色改为 ${resolved.accent}（${detail.join('、')}）`)
  }
  if (Math.abs(o.shadowPower - 1) >= 0.1) {
    parts.push(`阴影强度 ${o.shadowPower.toFixed(1)}×`)
  }
  return parts.join('，')
}
