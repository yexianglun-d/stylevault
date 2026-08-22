import {
  Boxes,
  Brain,
  Download,
  GitCompare,
  Heart,
  ImageUp,
  Shuffle,
  Sparkles,
} from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { allTags, categoryLabels, dimensionLabels, pageTypeLabels, styles } from '../data/styles'
import {
  defaultOverrides,
  resolvePreviewConfig,
  tuneCssVariables,
  tunePromptAddon,
  PARAM_RANGES,
} from '../data/parametric'
import {
  INTENT_TERMS as intentTerms,
  applyIntentDeltas,
  searchIntent,
} from '../data/intent'
import type {
  DesignStyle,
  DimensionKey,
  PageType,
  PreviewScenario,
  RecommendationPreference,
  StyleCategory,
} from '../types/style'
import type { ParametricOverrides } from '../data/parametric'

/**
 * 第 0 步结构改善：把原 App.vue 中 1300+ 行的共享状态与逻辑抽成单例 store。
 * 视图组件按需 named import，App.vue 仅保留外壳（导航/筛选/切换）。
 * 逻辑与原实现逐字一致，行为零变化。
 */

export type ViewKey = 'atlas' | 'recommend' | 'compare' | 'recognize' | 'mix' | 'learn' | 'favorites' | 'export'
export type DetailSectionKey = 'overview' | 'ai' | 'usage' | 'code' | 'related' | 'tune' | 'profile'
export type TrainingMode = 'preview' | 'features' | 'palette' | 'css' | 'difference' | 'pageType'
export interface LearningStats {
  total: number
  correct: number
  mistakes: Array<{ expectedId: string; answerId: string; at: string }>
}
export interface RecognitionRecord {
  id: string
  candidateId: string
  note: string
  palette: string[]
  tags: string[]
  savedAs: 'learning' | 'draft'
  createdAt: string
}
/** P4 审美画像：记录用户常用的意图词，沉淀成个人审美偏好。 */
export interface AestheticProfile {
  intentCounts: Record<string, number>
}

export { allTags, categoryLabels, dimensionLabels, pageTypeLabels, styles, PARAM_RANGES, intentTerms }

const storageKey = 'stylevault-state-v1'
export const dimensionKeys: DimensionKey[] = ['shape', 'typography', 'lighting', 'space', 'motion', 'color', 'texture']
export const views: Array<{ key: ViewKey; label: string; icon: typeof Boxes }> = [
  { key: 'atlas', label: '图鉴', icon: Boxes },
  { key: 'recommend', label: '推荐', icon: Sparkles },
  { key: 'compare', label: '对比', icon: GitCompare },
  { key: 'recognize', label: '识别', icon: ImageUp },
  { key: 'mix', label: '混合', icon: Shuffle },
  { key: 'learn', label: '学习', icon: Brain },
  { key: 'favorites', label: '收藏', icon: Heart },
  { key: 'export', label: '导出', icon: Download },
]
export const scenarioOptions: Array<{ key: PreviewScenario; label: string }> = [
  { key: 'card', label: '卡片' },
  { key: 'form', label: '表单' },
  { key: 'dashboard', label: '看板' },
  { key: 'marketing', label: '营销' },
  { key: 'navigation', label: '导航' },
  { key: 'list', label: '列表' },
  { key: 'pricing', label: '定价' },
  { key: 'article', label: '文章' },
  { key: 'appHome', label: 'App首页' },
  { key: 'appDetail', label: 'App详情' },
  { key: 'miniProgram', label: '小程序' },
  { key: 'miniForm', label: '小程序表单' },
]
export const detailSections: Array<{ key: DetailSectionKey; label: string }> = [
  { key: 'overview', label: '总览' },
  { key: 'ai', label: 'AI' },
  { key: 'usage', label: '适用' },
  { key: 'code', label: '代码' },
  { key: 'tune', label: '参数' },
  { key: 'profile', label: '画像' },
  { key: 'related', label: '相似' },
]
export const trainingModes: Array<{ key: TrainingMode; label: string }> = [
  { key: 'preview', label: '看预览' },
  { key: 'features', label: '看特征' },
  { key: 'palette', label: '看配色' },
  { key: 'css', label: '看 CSS' },
  { key: 'difference', label: '找差异' },
  { key: 'pageType', label: '选页面' },
]

function readViewFromHash(): ViewKey {
  const hash = window.location.hash.replace('#', '')
  return views.some((view) => view.key === hash) ? (hash as ViewKey) : 'atlas'
}

export const activeView = ref<ViewKey>(readViewFromHash())
export const query = ref('')
export const activeCategory = ref<StyleCategory | 'all'>('all')
export const activeTag = ref('all')
export const activePageType = ref<PageType | 'all'>('all')
export const selectedId = ref(styles[0].id)
export const compareLeftId = ref(styles[0].id)
export const compareRightId = ref(styles[10].id)
export const compareSlot = ref<'left' | 'right'>('right')
export const copiedKey = ref('')
export const favorites = ref<string[]>([])
export const recent = ref<string[]>([])
export const recognitionImage = ref('')
export const manualNote = ref('')
export const recognitionTags = ref<string[]>([])
export const recognitionPalette = ref<string[]>([])
export const recognitionSelectedId = ref(styles[0].id)
export const recognitionStatus = ref('上传截图后可本地提取主色；没有 AI Key 时仍保持手动拆解模式。')
export const previewScenario = ref<PreviewScenario>('card')
export const detailSection = ref<DetailSectionKey>('overview')
export const learnMode = ref<TrainingMode>('preview')
export const learnIndex = ref(0)
export const learnAnswer = ref('')
export const learnResult = ref<'idle' | 'right' | 'wrong'>('idle')
export const learningStats = ref<LearningStats>({ total: 0, correct: 0, mistakes: [] })
export const mixIds = ref<string[]>([styles[0].id, styles[10].id])
export const mixLeadDimension = ref<DimensionKey>('color')
export const mixWeight = ref(65)
export const recommendation = ref<RecommendationPreference>({
  pageType: 'ai-tool',
  tone: 'any',
  density: 'any',
  intensity: 'any',
  tags: [],
})
export const recognitionRecords = ref<RecognitionRecord[]>([])
export const aestheticProfile = ref<AestheticProfile>({ intentCounts: {} })
export const favoriteNotes = ref<Record<string, string>>({})
export const recentCopies = ref<Array<{ key: string; at: string }>>([])
export interface MixDraft {
  id: string
  name: string
  prompt: string
  variables: Record<string, string>
  createdAt: string
}
export const mixDrafts = ref<MixDraft[]>([])

export const selectedStyle = computed(() => styles.find((style) => style.id === selectedId.value) ?? styles[0])
export const overrides = ref<ParametricOverrides>(defaultOverrides(selectedStyle.value))
export function resetTune() {
  overrides.value = defaultOverrides(selectedStyle.value)
}
export const resolvedStyle = computed(() => {
  const style = selectedStyle.value
  const previewConfig = resolvePreviewConfig(style, overrides.value)
  const addon = tunePromptAddon(style, overrides.value)
  return {
    ...style,
    previewConfig,
    cssVariables: tuneCssVariables(style, overrides.value),
    promptTemplate: addon ? `${style.promptTemplate}（微调：${addon}）` : style.promptTemplate,
  }
})
// 意图翻译层（P2）：把模糊审美词映射成参数偏移，直接驱动 overrides
export const intentQuery = ref('')
export const matchedIntents = computed(() => searchIntent(intentQuery.value))
export function applyIntent(termId: string) {
  const term = intentTerms.find((t) => t.id === termId)
  if (!term) return
  overrides.value = applyIntentDeltas(overrides.value, term.deltas)
  recordIntentUsage(termId)
}
function recordIntentUsage(termId: string) {
  const counts = { ...aestheticProfile.value.intentCounts }
  counts[termId] = (counts[termId] ?? 0) + 1
  aestheticProfile.value = { intentCounts: counts }
}
/** P4 审美画像：按使用次数排序的 Top 意图词。 */
export const topIntents = computed(() =>
  intentTerms
    .map((term) => ({ term, count: aestheticProfile.value.intentCounts[term.id] ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5),
)
/** P4：把用户签名意图（使用最多的词）预载为当前风格的参数起点。 */
export function applyProfileDefault() {
  const top = topIntents.value[0]
  if (!top) return
  overrides.value = applyIntentDeltas(defaultOverrides(selectedStyle.value), top.term.deltas)
  detailSection.value = 'tune'
}
export function clearProfile() {
  aestheticProfile.value = { intentCounts: {} }
}
export const compareLeft = computed(() => styles.find((style) => style.id === compareLeftId.value) ?? styles[0])
export const compareRight = computed(() => styles.find((style) => style.id === compareRightId.value) ?? styles[1])
export const favoriteStyles = computed(() => styles.filter((style) => favorites.value.includes(style.id)))
export const recommendationTagOptions = computed(() => allTags.slice(0, 28))
export const similarStyles = computed(() =>
  styles
    .filter((style) => style.id !== selectedStyle.value.id)
    .map((style) => {
      const tagHits = style.tags.filter((tag) => selectedStyle.value.tags.includes(tag)).length
      const pageHits = style.pageTypes.filter((pageType) => selectedStyle.value.pageTypes.includes(pageType)).length
      return { style, score: tagHits * 2 + pageHits + (style.category === selectedStyle.value.category ? 3 : 0) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4),
)
export const learningAccuracy = computed(() =>
  learningStats.value.total ? Math.round((learningStats.value.correct / learningStats.value.total) * 100) : 0,
)

export const filteredStyles = computed(() => {
  const keyword = query.value.trim().toLowerCase()

  return styles.filter((style) => {
    const matchesCategory = activeCategory.value === 'all' || style.category === activeCategory.value
    const matchesTag = activeTag.value === 'all' || style.tags.includes(activeTag.value)
    const matchesPageType = activePageType.value === 'all' || style.pageTypes.includes(activePageType.value as PageType)
    const haystack = [style.nameZh, style.nameEn, style.summary, ...style.tags, ...style.useCases]
      .join(' ')
      .toLowerCase()
    return matchesCategory && matchesTag && matchesPageType && (!keyword || haystack.includes(keyword))
  })
})

export const recommendedStyles = computed(() => {
  return styles
    .map((style) => {
      let score = 0
      if (style.pageTypes.includes(recommendation.value.pageType)) score += 48
      score += recommendation.value.tags.filter((tag) => style.tags.includes(tag)).length * 12
      if (recommendation.value.density !== 'any' && style.density === recommendation.value.density) score += 14
      if (recommendation.value.intensity !== 'any' && style.visualIntensity === recommendation.value.intensity) score += 14
      if (recommendation.value.tone === 'dark' && style.tags.includes('暗色')) score += 10
      if (recommendation.value.tone === 'light' && style.tags.includes('浅色')) score += 10
      if (style.implementationCost === 'high') score -= 8
      return { style, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
})

export const recognitionCandidates = computed(() => {
  const words = manualNote.value
    .trim()
    .split(/[\s,，、。；;]+/)
    .filter(Boolean)
  const pickedTags = new Set([...recognitionTags.value, ...words])

  const maxScore = 140
  return styles
    .map((style) => {
      let score = 0
      score += style.tags.filter((tag) => pickedTags.has(tag)).length * 18
      score += style.visualFeatures.filter((feature) => words.some((word) => feature.includes(word))).length * 10
      score += dimensionKeys.filter((key) =>
        style.formCharacteristics[key].tags.some((tag) => pickedTags.has(tag) || words.some((word) => tag.includes(word))),
      ).length * 8
      if (recognitionImage.value) score += 4
      const matchedDimensions = dimensionKeys.filter((key) =>
        style.formCharacteristics[key].tags.some((tag) => pickedTags.has(tag) || words.some((word) => tag.includes(word))),
      )
      return {
        style,
        score,
        confidence: Math.min(0.96, Math.max(0.18, score / maxScore)),
        matchedDimensions,
      }
    })
    .filter((item) => item.score > 0 || recognitionImage.value || manualNote.value.trim())
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
})
export const recognitionDraft = computed(() => {
  const style =
    styles.find((item) => item.id === recognitionSelectedId.value) ?? recognitionCandidates.value[0]?.style ?? styles[0]
  return {
    title: `${style.nameZh} 识别草稿`,
    note: manualNote.value.trim() || `截图初步关联到 ${style.nameZh}，需要继续按 7 维度人工校正。`,
    prompt: `请根据截图观察，将界面拆解为 ${style.nameZh}/${style.nameEn} 方向：参考主色 ${recognitionPalette.value.join('、') || style.colorPalette.map((color) => color.hex).join('、')}，重点检查 ${style.tags.slice(0, 6).join('、')}，并输出 7 维度风格判断。`,
  }
})

export const learningQuestion = computed(() => styles[learnIndex.value % styles.length])
export const learningPair = computed(() => styles[(learnIndex.value + 11) % styles.length])
export const learningDifferenceKey = computed<DimensionKey>(() => {
  return (
    dimensionKeys.find((key) => {
      const left = learningQuestion.value.formCharacteristics[key].tags.join('|')
      const right = learningPair.value.formCharacteristics[key].tags.join('|')
      return left !== right
    }) ?? 'color'
  )
})
export const learningOptions = computed(() => {
  if (learnMode.value === 'difference') {
    return dimensionKeys.map((key) => ({ value: key, label: dimensionLabels[key] }))
  }

  const picks = [
    learningQuestion.value,
    learningPair.value,
    styles[(learnIndex.value + 17) % styles.length],
    styles[(learnIndex.value + 23) % styles.length],
  ]
  const unique = Array.from(new Map(picks.map((style) => [style.id, style])).values())
  return unique
    .sort((a, b) => ((a.id.length + learnIndex.value) % 7) - ((b.id.length + learnIndex.value) % 7))
    .map((style) => ({ value: style.id, label: style.nameZh }))
})
export const learningCorrectAnswer = computed(() =>
  learnMode.value === 'difference' ? learningDifferenceKey.value : learningQuestion.value.id,
)
export const learningExpectedLabel = computed(() => {
  if (learnMode.value === 'difference') return dimensionLabels[learningDifferenceKey.value]
  return learningQuestion.value.nameZh
})
export const learningPrompt = computed(() => {
  const style = learningQuestion.value
  if (learnMode.value === 'features') {
    return {
      title: '根据视觉特征判断风格',
      body: style.visualFeatures.join('；'),
    }
  }
  if (learnMode.value === 'palette') {
    return {
      title: '根据配色判断风格',
      body: style.colorPalette.map((color) => `${color.name} ${color.hex}`).join(' / '),
    }
  }
  if (learnMode.value === 'css') {
    return {
      title: '根据 CSS 片段判断风格',
      body: style.cssSnippets[0].code,
    }
  }
  if (learnMode.value === 'difference') {
    return {
      title: `判断 ${style.nameZh} 与 ${learningPair.value.nameZh} 最明显的差异维度`,
      body: `${style.formCharacteristics[learningDifferenceKey.value].tags.join('、')}  ↔  ${learningPair.value.formCharacteristics[learningDifferenceKey.value].tags.join('、')}`,
    }
  }
  if (learnMode.value === 'pageType') {
    return {
      title: '根据页面类型选择合适风格',
      body: `${style.pageTypes.map((pageType) => pageTypeLabels[pageType]).join(' / ')}；偏好：${style.tags.slice(0, 5).join('、')}`,
    }
  }
  return {
    title: '根据实时预览判断风格',
    body: '观察形状、排版、光影、空间、动效、色彩与质感。',
  }
})
export const learningExplanation = computed(() => {
  if (learnMode.value === 'difference') {
    return `${learningQuestion.value.nameZh} 与 ${learningPair.value.nameZh} 在「${dimensionLabels[learningDifferenceKey.value]}」上差异最明显：${learningPrompt.value.body}。`
  }
  return `${learningQuestion.value.nameZh} 的关键线索是 ${learningQuestion.value.tags.slice(0, 4).join('、')}；${learningQuestion.value.summary}`
})
export const mixedStyle = computed(() => {
  const selected = mixIds.value
    .map((id) => styles.find((style) => style.id === id))
    .filter((style): style is DesignStyle => Boolean(style))
  const tags = Array.from(new Set(selected.flatMap((style) => style.tags))).slice(0, 8)

  return {
    name: selected.map((style) => style.nameZh).join(' + '),
    prompt: `请融合 ${selected.map((style) => `${style.nameEn}/${style.nameZh}`).join('、')}：以“${dimensionLabels[mixLeadDimension.value]}”为主导维度，主风格权重 ${mixWeight.value}%，保留 ${tags.join('、')}；第一个风格控制基础布局和配色，其余风格只增强质感、细节与动效，避免视觉目标互相打架。`,
    variables: selected.reduce<Record<string, string>>((acc, style, index) => {
      acc[`--mix-${index + 1}-accent`] = style.previewConfig.accent
      acc[`--mix-${index + 1}-surface`] = style.previewConfig.surface
      return acc
    }, {}),
  }
})

export const selectedStyleJson = computed(() => JSON.stringify(selectedStyle.value, null, 2))
export const selectedStyleCss = computed(() => cssVariablesText(resolvedStyle.value))
export const selectedStyleTailwind = computed(() => tailwindText(resolvedStyle.value))
export const exportPayload = computed(() =>
  JSON.stringify(
    {
      version: 1,
      total: styles.length,
      styles,
    },
    null,
    2,
  ),
)
export const dataQualityRows = computed(() =>
  styles.map((style) => {
    const issues = styleQualityIssues(style)
    return {
      style,
      issues,
      status: issues.length ? '需补齐' : '通过',
    }
  }),
)
export const dataQualityScore = computed(() => {
  const passed = dataQualityRows.value.filter((row) => row.issues.length === 0).length
  return Math.round((passed / styles.length) * 100)
})

export function styleQualityIssues(style: DesignStyle) {
  const issues: string[] = []
  const missingDimensions = dimensionKeys.filter((key) => !style.formCharacteristics[key]?.tags.length)
  if (missingDimensions.length) issues.push(`缺少维度：${missingDimensions.map((key) => dimensionLabels[key]).join('、')}`)
  if (style.colorPalette.length < 4) issues.push('配色少于 4 个 token')
  if (style.tags.length < 5) issues.push('标签少于 5 个')
  if (!style.promptTemplate.trim()) issues.push('缺少 Prompt')
  if (!style.cssSnippets.length) issues.push('缺少 CSS 片段')
  if (!style.notesPath.trim()) issues.push('缺少笔记路径')
  return issues
}

export function cssVariablesText(style: DesignStyle) {
  const lines = Object.entries(style.cssVariables).map(([key, value]) => `  ${key}: ${value};`)
  return `:root {\n${lines.join('\n')}\n}`
}

export function tailwindText(style: DesignStyle) {
  return `export default ${JSON.stringify(style.tailwindTheme, null, 2)}`
}

export function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function recommendationReason(style: DesignStyle, score: number) {
  const hits = recommendation.value.tags.filter((tag) => style.tags.includes(tag))
  const parts = [`${pageTypeLabels[recommendation.value.pageType]}匹配`, `得分 ${score}`]
  if (hits.length) parts.push(`命中标签 ${hits.join('、')}`)
  if (recommendation.value.density !== 'any' && style.density === recommendation.value.density) parts.push('密度匹配')
  if (recommendation.value.intensity !== 'any' && style.visualIntensity === recommendation.value.intensity) parts.push('强度匹配')
  return parts.join(' · ')
}

function persistState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      favorites: favorites.value,
      recent: recent.value,
      selectedId: selectedId.value,
      previewScenario: previewScenario.value,
      learningStats: learningStats.value,
      recognitionRecords: recognitionRecords.value,
      aestheticProfile: aestheticProfile.value,
      favoriteNotes: favoriteNotes.value,
      recentCopies: recentCopies.value,
      mixDrafts: mixDrafts.value,
    }),
  )
}

export function loadState() {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return

  try {
    const data = JSON.parse(raw) as {
      favorites?: string[]
      recent?: string[]
      selectedId?: string
      previewScenario?: PreviewScenario
      learningStats?: LearningStats
      recognitionRecords?: RecognitionRecord[]
      aestheticProfile?: AestheticProfile
      favoriteNotes?: Record<string, string>
      recentCopies?: Array<{ key: string; at: string }>
      mixDrafts?: MixDraft[]
    }
    favorites.value = data.favorites ?? []
    recent.value = data.recent ?? []
    if (data.selectedId && styles.some((style) => style.id === data.selectedId)) selectedId.value = data.selectedId
    if (data.previewScenario && scenarioOptions.some((scenario) => scenario.key === data.previewScenario)) {
      previewScenario.value = data.previewScenario
    }
    if (data.learningStats) learningStats.value = data.learningStats
    recognitionRecords.value = data.recognitionRecords ?? []
    if (data.aestheticProfile) aestheticProfile.value = data.aestheticProfile
    favoriteNotes.value = data.favoriteNotes ?? {}
    recentCopies.value = data.recentCopies ?? []
    mixDrafts.value = data.mixDrafts ?? []
  } catch {
    localStorage.removeItem(storageKey)
  }
}

export function openStyle(style: DesignStyle) {
  if (activeView.value === 'compare') {
    if (compareSlot.value === 'left') {
      compareLeftId.value = style.id
      compareSlot.value = 'right'
    } else {
      compareRightId.value = style.id
      compareSlot.value = 'left'
    }
    return
  }

  selectedId.value = style.id
  activeView.value = 'atlas'
  recent.value = [style.id, ...recent.value.filter((id) => id !== style.id)].slice(0, 8)
}

export function toggleFavorite(style: DesignStyle) {
  favorites.value = favorites.value.includes(style.id)
    ? favorites.value.filter((id) => id !== style.id)
    : [style.id, ...favorites.value]
}

export function setFavoriteNote(styleId: string, note: string) {
  const notes = { ...favoriteNotes.value }
  if (note.trim()) notes[styleId] = note
  else delete notes[styleId]
  favoriteNotes.value = notes
}

export function saveMixDraft() {
  const mix = mixedStyle.value
  mixDrafts.value = [
    {
      id: `${Date.now()}`,
      name: mix.name,
      prompt: mix.prompt,
      variables: mix.variables,
      createdAt: new Date().toISOString(),
    },
    ...mixDrafts.value,
  ].slice(0, 12)
}

export async function copyText(key: string, text: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  recentCopies.value = [{ key, at: new Date().toISOString() }, ...recentCopies.value].slice(0, 10)
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1400)
}

export function toggleRecommendationTag(tag: string) {
  recommendation.value.tags = recommendation.value.tags.includes(tag)
    ? recommendation.value.tags.filter((item) => item !== tag)
    : [...recommendation.value.tags, tag].slice(0, 6)
}

export function toggleRecognitionTag(tag: string) {
  recognitionTags.value = recognitionTags.value.includes(tag)
    ? recognitionTags.value.filter((item) => item !== tag)
    : [...recognitionTags.value, tag].slice(0, 8)
}

function sampleStepFromImageSize(width: number, height: number) {
  return Math.max(1, Math.floor(Math.sqrt((width * height) / 1800)))
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function extractPaletteFromImage(source: string) {
  recognitionStatus.value = '正在本地分析截图主色...'
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    const canvas = document.createElement('canvas')
    const width = 96
    const height = Math.max(1, Math.round((image.height / image.width) * width))
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(image, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)
    const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>()
    const step = sampleStepFromImageSize(width, height)

    for (let index = 0; index < data.length; index += 4 * step) {
      const alpha = data[index + 3]
      if (alpha < 180) continue
      const red = Math.round(data[index] / 32) * 32
      const green = Math.round(data[index + 1] / 32) * 32
      const blue = Math.round(data[index + 2] / 32) * 32
      const key = `${red}-${green}-${blue}`
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 }
      bucket.count += 1
      bucket.red += data[index]
      bucket.green += data[index + 1]
      bucket.blue += data[index + 2]
      buckets.set(key, bucket)
    }

    recognitionPalette.value = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((bucket) =>
        rgbToHex(
          Math.round(bucket.red / bucket.count),
          Math.round(bucket.green / bucket.count),
          Math.round(bucket.blue / bucket.count),
        ),
      )
    recognitionStatus.value = `已本地提取 ${recognitionPalette.value.length} 个主色，候选结果仍可人工校正。`
  }
  image.onerror = () => {
    recognitionStatus.value = '图片读取失败，请重新上传或改用手动拆解。'
  }
  image.src = source
}

export function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (recognitionImage.value) URL.revokeObjectURL(recognitionImage.value)
  const source = URL.createObjectURL(file)
  recognitionImage.value = source
  extractPaletteFromImage(source)
}

export function selectRecognitionCandidate(style: DesignStyle) {
  recognitionSelectedId.value = style.id
}

export function saveRecognition(savedAs: RecognitionRecord['savedAs']) {
  const candidate =
    styles.find((style) => style.id === recognitionSelectedId.value) ?? recognitionCandidates.value[0]?.style
  if (!candidate) return
  recognitionRecords.value = [
    {
      id: `${Date.now()}-${candidate.id}`,
      candidateId: candidate.id,
      note: recognitionDraft.value.note,
      palette: recognitionPalette.value,
      tags: recognitionTags.value,
      savedAs,
      createdAt: new Date().toISOString(),
    },
    ...recognitionRecords.value,
  ].slice(0, 12)
  recognitionStatus.value = savedAs === 'learning' ? '已保存为学习记录。' : '已保存为新风格草稿。'
}

export function submitAnswer() {
  if (!learnAnswer.value || learnResult.value !== 'idle') return
  const isRight = learnAnswer.value === learningCorrectAnswer.value
  learnResult.value = isRight ? 'right' : 'wrong'
  learningStats.value = {
    total: learningStats.value.total + 1,
    correct: learningStats.value.correct + (isRight ? 1 : 0),
    mistakes: isRight
      ? learningStats.value.mistakes
      : [
          {
            expectedId: learningCorrectAnswer.value,
            answerId: learnAnswer.value,
            at: new Date().toISOString(),
          },
          ...learningStats.value.mistakes,
        ].slice(0, 6),
  }
}

export function nextQuestion() {
  learnIndex.value += 1
  learnAnswer.value = ''
  learnResult.value = 'idle'
}

export function setLearnMode(mode: TrainingMode) {
  learnMode.value = mode
  learnAnswer.value = ''
  learnResult.value = 'idle'
}

export function learningAnswerLabel(id: string) {
  return styles.find((style) => style.id === id)?.nameZh ?? dimensionLabels[id as DimensionKey] ?? id
}

export function toggleMix(style: DesignStyle) {
  if (mixIds.value.includes(style.id)) {
    mixIds.value = mixIds.value.filter((id) => id !== style.id)
    return
  }
  if (mixIds.value.length < 3) mixIds.value = [...mixIds.value, style.id]
}

watch(
  [favorites, recent, selectedId, previewScenario, learningStats, recognitionRecords, aestheticProfile, favoriteNotes, recentCopies, mixDrafts],
  persistState,
  { deep: true },
)
watch(selectedId, () => {
  detailSection.value = 'overview'
  overrides.value = defaultOverrides(selectedStyle.value)
})
watch(recognitionCandidates, (candidates) => {
  if (candidates.length && !candidates.some((candidate) => candidate.style.id === recognitionSelectedId.value)) {
    recognitionSelectedId.value = candidates[0].style.id
  }
})
watch(activeView, (view) => {
  window.history.replaceState(null, '', `#${view}`)
})
