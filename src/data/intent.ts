import type { ParametricOverrides } from './parametric'
import { PARAM_RANGES } from './parametric'

/**
 * 意图翻译层（P2）：把「高级一点 / 更活泼」这类模糊审美词，
 * 映射成我们已建好的连续参数空间（圆角 / 色相 / 饱和度 / 阴影强度）的偏移量。
 *
 * 这是 StyleVault 的核心价值——把人类模糊的审美意图，压缩成 AI 能直接消费的结构化规格。
 * 数据是驱动式的：新增一个审美词 = 往 INTENT_TERMS 加一条，无需改逻辑。
 */

export interface IntentTerm {
  /** 稳定 id，供 store 调用 */
  id: string
  /** 主词，展示用 */
  term: string
  /** 同义/口语别名，用于检索匹配 */
  aliases: string[]
  /** 一句话解释它把视觉往哪个方向推，作为 chip 的 tooltip */
  description: string
  /** 相对当前参数的偏移；只写非零维度，省略的维度保持不变 */
  deltas: Partial<ParametricOverrides>
}

export const INTENT_TERMS: IntentTerm[] = [
  {
    id: 'sophisticated',
    term: '高级',
    aliases: ['精致', '克制', '优雅', '高级感'],
    description: '圆角更小、饱和度降低、阴影更弱——更克制、精致',
    deltas: { radius: -8, accentSat: -20, shadowPower: -0.3 },
  },
  {
    id: 'lively',
    term: '活泼',
    aliases: ['年轻', '有活力', '热闹'],
    description: '圆角更大、饱和度提高、阴影稍强——更跳脱、有活力',
    deltas: { radius: 10, accentSat: 25, shadowPower: 0.2 },
  },
  {
    id: 'gentle',
    term: '温柔',
    aliases: ['柔和', '治愈', '软'],
    description: '圆角更大、饱和度略降、阴影更弱——更轻盈、亲和无攻击性',
    deltas: { radius: 12, accentSat: -10, shadowPower: -0.4 },
  },
  {
    id: 'cute',
    term: '可爱',
    aliases: ['萌', 'Q', '童趣'],
    description: '圆角明显变大、饱和度提高、阴影更柔——更圆润讨喜',
    deltas: { radius: 16, accentSat: 20, shadowPower: -0.3 },
  },
  {
    id: 'tech',
    term: '科技感',
    aliases: ['未来', '极客', '数字', '赛博'],
    description: '圆角收小、色相偏冷、饱和度提高、阴影更强——更锐利、数字感',
    deltas: { radius: -10, accentHue: -40, accentSat: 10, shadowPower: 0.4 },
  },
  {
    id: 'retro',
    term: '复古',
    aliases: ['怀旧', '年代感', '做旧'],
    description: '色相偏暖、饱和度略降——更有年代温度',
    deltas: { accentHue: 30, accentSat: -15 },
  },
  {
    id: 'business',
    term: '商务',
    aliases: ['专业', '严肃', '正式', '靠谱'],
    description: '圆角收小、饱和度降低、阴影克制——更稳重专业',
    deltas: { radius: -6, accentSat: -25, shadowPower: -0.2 },
  },
  {
    id: 'minimal',
    term: '极简',
    aliases: ['干净', '留白', '朴素', '简约'],
    description: '圆角收小、饱和度大幅降低、阴影极弱——更安静、克制',
    deltas: { radius: -10, accentSat: -30, shadowPower: -0.5 },
  },
  {
    id: 'warm',
    term: '温暖',
    aliases: ['暖', '亲和', '热情'],
    description: '色相偏暖、饱和度微增——更有人情味',
    deltas: { accentHue: 35, accentSat: 5 },
  },
  {
    id: 'calm',
    term: '冷静',
    aliases: ['冷', '理性', '沉稳'],
    description: '色相偏冷、饱和度略降——更理性克制',
    deltas: { accentHue: -35, accentSat: -10 },
  },
  {
    id: 'bold',
    term: '强烈',
    aliases: ['醒目', '冲击', '重', '浓烈'],
    description: '饱和度大幅提高、阴影更强——更有视觉分量',
    deltas: { accentSat: 30, shadowPower: 0.6 },
  },
  {
    id: 'soft',
    term: '柔和',
    aliases: ['轻', '淡', '朦胧'],
    description: '饱和度降、阴影弱、圆角略增——更轻盈不抢眼',
    deltas: { radius: 6, accentSat: -15, shadowPower: -0.4 },
  },
  {
    id: 'fresh',
    term: '清新',
    aliases: ['自然', '清爽', '氧气', '绿意'],
    description: '色相偏绿、饱和度微增、阴影更弱——更通透自然',
    deltas: { accentHue: 15, accentSat: 5, shadowPower: -0.2 },
  },
  {
    id: 'dark',
    term: '暗黑',
    aliases: ['暗', '酷', '夜', '神秘', '氛围'],
    description: '饱和度降低、阴影更强——更有氛围与纵深',
    deltas: { accentSat: -20, shadowPower: 0.5 },
  },
]

/** 把偏移叠加到当前参数上，并按各维度取值范围 clamp，避免越界。 */
export function applyIntentDeltas(base: ParametricOverrides, deltas: Partial<ParametricOverrides>): ParametricOverrides {
  const next: ParametricOverrides = { ...base }
  for (const key of Object.keys(deltas) as Array<keyof ParametricOverrides>) {
    const cfg = PARAM_RANGES[key]
    const delta = deltas[key]
    if (delta === undefined || cfg === undefined) continue
    next[key] = Math.min(cfg.max, Math.max(cfg.min, base[key] + delta))
  }
  return next
}

/** 模糊检索：匹配主词 / 别名 / 描述。空查询返回全部。 */
export function searchIntent(query: string): IntentTerm[] {
  const q = query.trim().toLowerCase()
  if (!q) return INTENT_TERMS
  return INTENT_TERMS.filter((term) =>
    [term.term, ...term.aliases, term.description].some((text) => text.toLowerCase().includes(q)),
  )
}

export interface IntentInference {
  term: IntentTerm
  /** 0~1，越接近 1 说明当前参数越像这个意图词 */
  score: number
}

/**
 * 闭环验证（P3·反向识别）：给定「风格默认参数」与「当前实际参数」，
 * 算出用户施加的偏移，再用同一份 INTENT_TERMS 反推最匹配的意图词。
 * 正向翻译（词→参数）与反向识别（参数→词）共用一本词典，因此：
 * 点一个意图词生成的参数，应当被反推以高置信度识别为同一个词——链路自洽可逆。
 */
export function inferIntents(base: ParametricOverrides, current: ParametricOverrides): IntentInference[] {
  const delta: ParametricOverrides = {
    radius: current.radius - base.radius,
    accentHue: current.accentHue - base.accentHue,
    accentSat: current.accentSat - base.accentSat,
    shadowPower: current.shadowPower - base.shadowPower,
  }
  const moved =
    Math.abs(delta.radius) >= 1 ||
    Math.abs(delta.accentHue) >= 5 ||
    Math.abs(delta.accentSat) >= 5 ||
    Math.abs(delta.shadowPower - 1) >= 0.1
  if (!moved) return []

  return INTENT_TERMS.map((term) => {
    const d = term.deltas
    const defined = (Object.keys(d) as Array<keyof ParametricOverrides>).filter((k) => d[k] !== undefined)
    if (!defined.length) return { term, score: 0 }
    let span = 0
    let err = 0
    for (const k of defined) {
      const target = d[k] as number
      const actual = delta[k]
      span += Math.abs(target)
      err += Math.abs(actual - target)
    }
    const score = span === 0 ? 0 : Math.max(0, 1 - err / span)
    return { term, score }
  })
    .filter((item) => item.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}
