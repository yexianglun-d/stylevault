<script setup lang="ts">
import {
  Boxes,
  Brain,
  Check,
  Clipboard,
  Download,
  GitCompare,
  Heart,
  ImageUp,
  Search,
  Shuffle,
  Sparkles,
  Star,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import StylePreview from './components/StylePreview.vue'
import { allTags, categoryLabels, dimensionLabels, pageTypeLabels, styles } from './data/styles'
import type { DesignStyle, DimensionKey, PreviewScenario, RecommendationPreference, StyleCategory } from './types/style'

type ViewKey = 'atlas' | 'recommend' | 'compare' | 'recognize' | 'mix' | 'learn' | 'favorites' | 'export'
type DetailSectionKey = 'overview' | 'ai' | 'usage' | 'code' | 'related'
type TrainingMode = 'preview' | 'features' | 'palette' | 'css' | 'difference' | 'pageType'
type LearningStats = {
  total: number
  correct: number
  mistakes: Array<{ expectedId: string; answerId: string; at: string }>
}
type RecognitionRecord = {
  id: string
  candidateId: string
  note: string
  palette: string[]
  tags: string[]
  savedAs: 'learning' | 'draft'
  createdAt: string
}

const storageKey = 'stylevault-state-v1'
const dimensionKeys: DimensionKey[] = ['shape', 'typography', 'lighting', 'space', 'motion', 'color', 'texture']
const views: Array<{ key: ViewKey; label: string; icon: typeof Boxes }> = [
  { key: 'atlas', label: '图鉴', icon: Boxes },
  { key: 'recommend', label: '推荐', icon: Sparkles },
  { key: 'compare', label: '对比', icon: GitCompare },
  { key: 'recognize', label: '识别', icon: ImageUp },
  { key: 'mix', label: '混合', icon: Shuffle },
  { key: 'learn', label: '学习', icon: Brain },
  { key: 'favorites', label: '收藏', icon: Heart },
  { key: 'export', label: '导出', icon: Download },
]
const scenarioOptions: Array<{ key: PreviewScenario; label: string }> = [
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
const detailSections: Array<{ key: DetailSectionKey; label: string }> = [
  { key: 'overview', label: '总览' },
  { key: 'ai', label: 'AI' },
  { key: 'usage', label: '适用' },
  { key: 'code', label: '代码' },
  { key: 'related', label: '相似' },
]
const trainingModes: Array<{ key: TrainingMode; label: string }> = [
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

const activeView = ref<ViewKey>(readViewFromHash())
const query = ref('')
const activeCategory = ref<StyleCategory | 'all'>('all')
const activeTag = ref('all')
const selectedId = ref(styles[0].id)
const compareLeftId = ref(styles[0].id)
const compareRightId = ref(styles[10].id)
const compareSlot = ref<'left' | 'right'>('right')
const copiedKey = ref('')
const favorites = ref<string[]>([])
const recent = ref<string[]>([])
const recognitionImage = ref('')
const manualNote = ref('')
const recognitionTags = ref<string[]>([])
const recognitionPalette = ref<string[]>([])
const recognitionSelectedId = ref(styles[0].id)
const recognitionRecords = ref<RecognitionRecord[]>([])
const recognitionStatus = ref('上传截图后可本地提取主色；没有 AI Key 时仍保持手动拆解模式。')
const previewScenario = ref<PreviewScenario>('card')
const detailSection = ref<DetailSectionKey>('overview')
const learnMode = ref<TrainingMode>('preview')
const learnIndex = ref(0)
const learnAnswer = ref('')
const learnResult = ref<'idle' | 'right' | 'wrong'>('idle')
const learningStats = ref<LearningStats>({ total: 0, correct: 0, mistakes: [] })
const mixIds = ref<string[]>([styles[0].id, styles[10].id])
const mixLeadDimension = ref<DimensionKey>('color')
const mixWeight = ref(65)
const recommendation = ref<RecommendationPreference>({
  pageType: 'ai-tool',
  tone: 'any',
  density: 'any',
  intensity: 'any',
  tags: [],
})

const selectedStyle = computed(() => styles.find((style) => style.id === selectedId.value) ?? styles[0])
const compareLeft = computed(() => styles.find((style) => style.id === compareLeftId.value) ?? styles[0])
const compareRight = computed(() => styles.find((style) => style.id === compareRightId.value) ?? styles[1])
const favoriteStyles = computed(() => styles.filter((style) => favorites.value.includes(style.id)))
const recommendationTagOptions = computed(() => allTags.slice(0, 28))
const similarStyles = computed(() =>
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
const learningAccuracy = computed(() =>
  learningStats.value.total ? Math.round((learningStats.value.correct / learningStats.value.total) * 100) : 0,
)

const filteredStyles = computed(() => {
  const keyword = query.value.trim().toLowerCase()

  return styles.filter((style) => {
    const matchesCategory = activeCategory.value === 'all' || style.category === activeCategory.value
    const matchesTag = activeTag.value === 'all' || style.tags.includes(activeTag.value)
    const haystack = [style.nameZh, style.nameEn, style.summary, ...style.tags, ...style.useCases]
      .join(' ')
      .toLowerCase()
    return matchesCategory && matchesTag && (!keyword || haystack.includes(keyword))
  })
})

const recommendedStyles = computed(() => {
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

const recognitionCandidates = computed(() => {
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
const recognitionDraft = computed(() => {
  const style = styles.find((item) => item.id === recognitionSelectedId.value) ?? recognitionCandidates.value[0]?.style ?? styles[0]
  return {
    title: `${style.nameZh} 识别草稿`,
    note: manualNote.value.trim() || `截图初步关联到 ${style.nameZh}，需要继续按 7 维度人工校正。`,
    prompt: `请根据截图观察，将界面拆解为 ${style.nameZh}/${style.nameEn} 方向：参考主色 ${recognitionPalette.value.join('、') || style.colorPalette.map((color) => color.hex).join('、')}，重点检查 ${style.tags.slice(0, 6).join('、')}，并输出 7 维度风格判断。`,
  }
})

const learningQuestion = computed(() => styles[learnIndex.value % styles.length])
const learningPair = computed(() => styles[(learnIndex.value + 11) % styles.length])
const learningDifferenceKey = computed<DimensionKey>(() => {
  return (
    dimensionKeys.find((key) => {
      const left = learningQuestion.value.formCharacteristics[key].tags.join('|')
      const right = learningPair.value.formCharacteristics[key].tags.join('|')
      return left !== right
    }) ?? 'color'
  )
})
const learningOptions = computed(() => {
  if (learnMode.value === 'difference') {
    return dimensionKeys.map((key) => ({ value: key, label: dimensionLabels[key] }))
  }

  const picks = [learningQuestion.value, learningPair.value, styles[(learnIndex.value + 17) % styles.length], styles[(learnIndex.value + 23) % styles.length]]
  const unique = Array.from(new Map(picks.map((style) => [style.id, style])).values())
  return unique
    .sort((a, b) => ((a.id.length + learnIndex.value) % 7) - ((b.id.length + learnIndex.value) % 7))
    .map((style) => ({ value: style.id, label: style.nameZh }))
})
const learningCorrectAnswer = computed(() =>
  learnMode.value === 'difference' ? learningDifferenceKey.value : learningQuestion.value.id,
)
const learningExpectedLabel = computed(() => {
  if (learnMode.value === 'difference') return dimensionLabels[learningDifferenceKey.value]
  return learningQuestion.value.nameZh
})
const learningPrompt = computed(() => {
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
const learningExplanation = computed(() => {
  if (learnMode.value === 'difference') {
    return `${learningQuestion.value.nameZh} 与 ${learningPair.value.nameZh} 在「${dimensionLabels[learningDifferenceKey.value]}」上差异最明显：${learningPrompt.value.body}。`
  }
  return `${learningQuestion.value.nameZh} 的关键线索是 ${learningQuestion.value.tags.slice(0, 4).join('、')}；${learningQuestion.value.summary}`
})
const mixedStyle = computed(() => {
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

const selectedStyleJson = computed(() => JSON.stringify(selectedStyle.value, null, 2))
const selectedStyleCss = computed(() => cssVariablesText(selectedStyle.value))
const selectedStyleTailwind = computed(() => tailwindText(selectedStyle.value))
const exportPayload = computed(() =>
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
const dataQualityRows = computed(() =>
  styles.map((style) => {
    const issues = styleQualityIssues(style)
    return {
      style,
      issues,
      status: issues.length ? '需补齐' : '通过',
    }
  }),
)
const dataQualityScore = computed(() => {
  const passed = dataQualityRows.value.filter((row) => row.issues.length === 0).length
  return Math.round((passed / styles.length) * 100)
})

function styleQualityIssues(style: DesignStyle) {
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

function cssVariablesText(style: DesignStyle) {
  const lines = Object.entries(style.cssVariables).map(([key, value]) => `  ${key}: ${value};`)
  return `:root {\n${lines.join('\n')}\n}`
}

function tailwindText(style: DesignStyle) {
  return `export default ${JSON.stringify(style.tailwindTheme, null, 2)}`
}

function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function recommendationReason(style: DesignStyle, score: number) {
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
    }),
  )
}

function loadState() {
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
    }
    favorites.value = data.favorites ?? []
    recent.value = data.recent ?? []
    if (data.selectedId && styles.some((style) => style.id === data.selectedId)) selectedId.value = data.selectedId
    if (data.previewScenario && scenarioOptions.some((scenario) => scenario.key === data.previewScenario)) {
      previewScenario.value = data.previewScenario
    }
    if (data.learningStats) learningStats.value = data.learningStats
    recognitionRecords.value = data.recognitionRecords ?? []
  } catch {
    localStorage.removeItem(storageKey)
  }
}

function openStyle(style: DesignStyle) {
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

function toggleFavorite(style: DesignStyle) {
  favorites.value = favorites.value.includes(style.id)
    ? favorites.value.filter((id) => id !== style.id)
    : [style.id, ...favorites.value]
}

async function copyText(key: string, text: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1400)
}

function toggleRecommendationTag(tag: string) {
  recommendation.value.tags = recommendation.value.tags.includes(tag)
    ? recommendation.value.tags.filter((item) => item !== tag)
    : [...recommendation.value.tags, tag].slice(0, 6)
}

function toggleRecognitionTag(tag: string) {
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

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (recognitionImage.value) URL.revokeObjectURL(recognitionImage.value)
  const source = URL.createObjectURL(file)
  recognitionImage.value = source
  extractPaletteFromImage(source)
}

function selectRecognitionCandidate(style: DesignStyle) {
  recognitionSelectedId.value = style.id
}

function saveRecognition(savedAs: RecognitionRecord['savedAs']) {
  const candidate = styles.find((style) => style.id === recognitionSelectedId.value) ?? recognitionCandidates.value[0]?.style
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

function submitAnswer() {
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

function nextQuestion() {
  learnIndex.value += 1
  learnAnswer.value = ''
  learnResult.value = 'idle'
}

function setLearnMode(mode: TrainingMode) {
  learnMode.value = mode
  learnAnswer.value = ''
  learnResult.value = 'idle'
}

function learningAnswerLabel(id: string) {
  return styles.find((style) => style.id === id)?.nameZh ?? dimensionLabels[id as DimensionKey] ?? id
}

function toggleMix(style: DesignStyle) {
  if (mixIds.value.includes(style.id)) {
    mixIds.value = mixIds.value.filter((id) => id !== style.id)
    return
  }
  if (mixIds.value.length < 3) mixIds.value = [...mixIds.value, style.id]
}

watch(
  [favorites, recent, selectedId, previewScenario, learningStats, recognitionRecords],
  persistState,
  { deep: true },
)
watch(selectedId, () => {
  detailSection.value = 'overview'
})
watch(recognitionCandidates, (candidates) => {
  if (candidates.length && !candidates.some((candidate) => candidate.style.id === recognitionSelectedId.value)) {
    recognitionSelectedId.value = candidates[0].style.id
  }
})
watch(activeView, (view) => {
  window.history.replaceState(null, '', `#${view}`)
})
onMounted(loadState)
</script>

<template>
  <main class="app-shell">
    <header class="atlas-hero">
      <div class="brand-line">StyleVault</div>
      <h1>前端设计风格图鉴</h1>
      <p>UI DESIGN STYLE ATLAS</p>
      <div class="hero-badge">{{ styles.length }} 种风格 · 7 维度形态拆解 · AI Prompt</div>
    </header>

    <nav class="mode-switch" aria-label="功能模式">
      <button
        v-for="view in views"
        :key="view.key"
        :class="{ active: activeView === view.key }"
        type="button"
        @click="activeView = view.key"
      >
        <component :is="view.icon" :size="15" />
        {{ view.label }}
      </button>
    </nav>

    <section class="filter-bar" aria-label="风格筛选">
      <div class="search-box">
        <Search :size="17" />
        <input v-model="query" type="search" placeholder="搜索风格、标签、页面类型" />
      </div>
      <div class="category-row">
        <button :class="{ active: activeCategory === 'all' }" type="button" @click="activeCategory = 'all'">全部</button>
        <button
          v-for="(label, key) in categoryLabels"
          :key="key"
          :class="{ active: activeCategory === key }"
          type="button"
          @click="activeCategory = key"
        >
          {{ label }}类
        </button>
      </div>
      <select v-model="activeTag" aria-label="标签筛选">
        <option value="all">全部标签</option>
        <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
    </section>

    <div class="style-tabs" aria-label="风格列表">
      <button
        v-for="style in filteredStyles"
        :key="style.id"
        :class="{
          active:
            activeView === 'compare'
              ? compareLeft.id === style.id || compareRight.id === style.id
              : selectedStyle.id === style.id,
        }"
        type="button"
        @click="openStyle(style)"
      >
        {{ style.nameZh }}
      </button>
    </div>

    <section v-if="activeView === 'atlas'" class="atlas-board">
      <div class="preview-frame">
        <div class="window-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <code>preview.{{ selectedStyle.id }}.ui</code>
        </div>
        <div class="scenario-switch" aria-label="预览场景">
          <button
            v-for="scenario in scenarioOptions"
            :key="scenario.key"
            :class="{ active: previewScenario === scenario.key }"
            type="button"
            @click="previewScenario = scenario.key"
          >
            {{ scenario.label }}
          </button>
        </div>
        <StylePreview :style="selectedStyle" :scenario="previewScenario" />
        <div class="preview-notes">
          <div>
            <strong>风格探索</strong>
            <span>从视觉语言到 AI 可执行描述</span>
          </div>
          <div>
            <strong>组件预览</strong>
            <span>卡片、按钮、输入区域的真实表现</span>
          </div>
        </div>
      </div>

      <aside class="info-stack">
        <article class="name-card">
          <div>
            <h2>{{ selectedStyle.nameZh }}</h2>
            <p>{{ selectedStyle.nameEn }}</p>
          </div>
          <span>{{ categoryLabels[selectedStyle.category] }}类</span>
        </article>

        <div class="detail-nav" aria-label="详情分组">
          <button
            v-for="section in detailSections"
            :key="section.key"
            :class="{ active: detailSection === section.key }"
            type="button"
            @click="detailSection = section.key"
          >
            {{ section.label }}
          </button>
        </div>

        <div v-if="detailSection === 'overview'" class="detail-section">
          <article class="info-card">
            <h3>基础信息</h3>
            <div class="meta-grid">
              <div>
                <strong>适用页面</strong>
                <span>{{ selectedStyle.pageTypes.map((pageType) => pageTypeLabels[pageType]).join(' / ') }}</span>
              </div>
              <div>
                <strong>信息密度</strong>
                <span>{{ selectedStyle.density }}</span>
              </div>
              <div>
                <strong>视觉强度</strong>
                <span>{{ selectedStyle.visualIntensity }}</span>
              </div>
              <div>
                <strong>实现成本</strong>
                <span>{{ selectedStyle.implementationCost }}</span>
              </div>
            </div>
            <div class="tag-row">
              <i v-for="tag in selectedStyle.tags" :key="tag">{{ tag }}</i>
            </div>
          </article>

          <article class="info-card">
            <h3>核心视觉特征</h3>
            <ul class="feature-list">
              <li v-for="feature in selectedStyle.visualFeatures" :key="feature">{{ feature }}</li>
            </ul>
          </article>

          <article class="info-card">
            <h3>7 维度形态拆解</h3>
            <div class="dimension-grid">
              <div v-for="(dimension, key) in selectedStyle.formCharacteristics" :key="key">
                <strong>{{ dimensionLabels[key] }}</strong>
                <span>{{ dimension.tags.join(' / ') }}</span>
              </div>
            </div>
          </article>

          <article class="info-card">
            <h3>配色方案</h3>
            <div class="palette-grid">
              <button
                v-for="color in selectedStyle.colorPalette"
                :key="`${selectedStyle.id}-${color.role}`"
                type="button"
                @click="copyText(`color-${color.role}`, color.hex)"
              >
                <i :style="{ background: color.hex }"></i>
                <span>{{ color.name }}</span>
                <code>{{ color.hex }}</code>
              </button>
            </div>
          </article>
        </div>

        <article v-else-if="detailSection === 'ai'" class="info-card">
          <h3>AI 协作</h3>
          <p class="prompt-text">{{ selectedStyle.promptTemplate }}</p>
          <div class="action-row">
            <button type="button" @click="copyText('selected-prompt', selectedStyle.promptTemplate)">
              <Check v-if="copiedKey === 'selected-prompt'" :size="16" />
              <Clipboard v-else :size="16" />
              {{ copiedKey === 'selected-prompt' ? '已复制 Prompt' : '复制 Prompt' }}
            </button>
            <button type="button" @click="copyText('selected-css', selectedStyle.cssSnippets[0].code)">
              <Clipboard :size="16" />
              CSS
            </button>
            <button type="button" @click="toggleFavorite(selectedStyle)">
              <Heart :size="16" :fill="favorites.includes(selectedStyle.id) ? 'currentColor' : 'none'" />
              收藏
            </button>
          </div>
        </article>

        <article v-else-if="detailSection === 'usage'" class="info-card">
          <h3>适用与避坑</h3>
          <div class="usage-grid">
            <div>
              <strong>适合</strong>
              <span v-for="item in selectedStyle.useCases" :key="item">{{ item }}</span>
            </div>
            <div>
              <strong>不适合</strong>
              <span v-for="item in selectedStyle.avoidCases" :key="item">{{ item }}</span>
            </div>
          </div>
        </article>

        <article v-else-if="detailSection === 'code'" class="info-card">
          <h3>代码资产</h3>
          <div class="code-asset">
            <strong>{{ selectedStyle.cssSnippets[0].title }}</strong>
            <pre>{{ selectedStyle.cssSnippets[0].code }}</pre>
          </div>
          <div class="action-row">
            <button type="button" @click="copyText('selected-vars', selectedStyleCss)">
              <Clipboard :size="16" />
              {{ copiedKey === 'selected-vars' ? '已复制 Variables' : '复制 Variables' }}
            </button>
            <button type="button" @click="copyText('selected-tailwind', selectedStyleTailwind)">
              <Clipboard :size="16" />
              Tailwind
            </button>
          </div>
        </article>

        <article v-else class="info-card">
          <h3>相似风格与笔记</h3>
          <div class="similar-list">
            <button v-for="{ style } in similarStyles" :key="style.id" type="button" @click="openStyle(style)">
              <span>{{ style.nameZh }}</span>
              <small>{{ style.tags.slice(0, 3).join(' / ') }}</small>
            </button>
          </div>
          <p class="note-link">笔记路径：{{ selectedStyle.notesPath }}</p>
        </article>
      </aside>
    </section>

      <section v-else-if="activeView === 'recommend'" class="panel-view">
        <div class="section-head">
          <Sparkles :size="22" />
          <div>
            <h2>按页面类型推荐风格</h2>
            <p>先用本地规则保证稳定，AI 只作为后续解释增强。</p>
          </div>
        </div>
        <div class="recommend-layout">
          <div class="control-panel">
            <label>
              页面类型
              <select v-model="recommendation.pageType">
                <option v-for="(label, key) in pageTypeLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>
            <label>
              明暗偏好
              <select v-model="recommendation.tone">
                <option value="any">不限</option>
                <option value="dark">暗色</option>
                <option value="light">浅色</option>
              </select>
            </label>
            <label>
              信息密度
              <select v-model="recommendation.density">
                <option value="any">不限</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </label>
            <label>
              视觉强度
              <select v-model="recommendation.intensity">
                <option value="any">不限</option>
                <option value="restrained">克制</option>
                <option value="balanced">平衡</option>
                <option value="expressive">强冲击</option>
              </select>
            </label>
            <div class="tag-picker">
              <span>偏好标签</span>
              <button
                v-for="tag in recommendationTagOptions"
                :key="tag"
                :class="{ active: recommendation.tags.includes(tag) }"
                type="button"
                @click="toggleRecommendationTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="result-list">
            <article v-for="{ style, score } in recommendedStyles" :key="style.id" class="result-row">
              <StylePreview :style="style" compact />
              <div>
                <span>{{ recommendationReason(style, score) }} · {{ categoryLabels[style.category] }}</span>
                <h3>{{ style.nameZh }}</h3>
                <p>{{ style.summary }}</p>
                <small>风险：{{ style.implementationCost === 'high' ? '实现成本较高，需要控制细节。' : '可较快落地，注意保持一致性。' }}</small>
              </div>
              <button type="button" @click="copyText(`rec-${style.id}`, style.promptTemplate)">
                <Clipboard :size="16" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section v-else-if="activeView === 'compare'" class="compare-board">
        <div class="section-head">
          <GitCompare :size="22" />
          <div>
            <h2>双风格对比</h2>
            <p>选择 A/B 两个风格，直接看视觉、形态、配色和 Prompt 调整方向。</p>
          </div>
        </div>

        <div class="compare-toolbar">
          <div class="slot-switch">
            <button :class="{ active: compareSlot === 'left' }" type="button" @click="compareSlot = 'left'">
              A · {{ compareLeft.nameZh }}
            </button>
            <button :class="{ active: compareSlot === 'right' }" type="button" @click="compareSlot = 'right'">
              B · {{ compareRight.nameZh }}
            </button>
          </div>
          <p>点上方风格胶囊，会替换当前高亮的对比槽位。</p>
        </div>

        <div class="compare-selectors">
          <label>
            风格 A
            <select v-model="compareLeftId">
              <option v-for="style in styles" :key="style.id" :value="style.id">{{ style.nameZh }}</option>
            </select>
          </label>
          <label>
            风格 B
            <select v-model="compareRightId">
              <option v-for="style in styles" :key="style.id" :value="style.id">{{ style.nameZh }}</option>
            </select>
          </label>
        </div>

        <div class="compare-visuals">
          <article class="compare-pane">
            <div class="compare-title">
              <span>A</span>
              <div>
                <h3>{{ compareLeft.nameZh }}</h3>
                <p>{{ compareLeft.nameEn }} · {{ categoryLabels[compareLeft.category] }}类</p>
              </div>
            </div>
            <StylePreview :style="compareLeft" />
            <p>{{ compareLeft.summary }}</p>
          </article>
          <article class="compare-pane">
            <div class="compare-title">
              <span>B</span>
              <div>
                <h3>{{ compareRight.nameZh }}</h3>
                <p>{{ compareRight.nameEn }} · {{ categoryLabels[compareRight.category] }}类</p>
              </div>
            </div>
            <StylePreview :style="compareRight" />
            <p>{{ compareRight.summary }}</p>
          </article>
        </div>

        <div class="compare-table">
          <div class="compare-table-head">
            <strong>维度</strong>
            <strong>{{ compareLeft.nameZh }}</strong>
            <strong>{{ compareRight.nameZh }}</strong>
          </div>
          <div v-for="(_, key) in compareLeft.formCharacteristics" :key="key">
            <strong>{{ dimensionLabels[key] }}</strong>
            <span>{{ compareLeft.formCharacteristics[key].tags.join(' / ') }}</span>
            <span>{{ compareRight.formCharacteristics[key].tags.join(' / ') }}</span>
          </div>
        </div>

        <div class="compare-palette">
          <article>
            <h3>{{ compareLeft.nameZh }} 配色</h3>
            <div>
              <i v-for="color in compareLeft.colorPalette" :key="color.role" :style="{ background: color.hex }"></i>
            </div>
          </article>
          <article>
            <h3>{{ compareRight.nameZh }} 配色</h3>
            <div>
              <i v-for="color in compareRight.colorPalette" :key="color.role" :style="{ background: color.hex }"></i>
            </div>
          </article>
        </div>

        <button
          class="primary-action"
          type="button"
          @click="copyText('compare-prompt', `请把当前页面从 ${compareLeft.nameZh} 调整为 ${compareRight.nameZh}：减少 ${compareLeft.tags.slice(0, 3).join('、')}，增强 ${compareRight.tags.slice(0, 5).join('、')}。`)"
        >
          <Clipboard :size="16" />
          {{ copiedKey === 'compare-prompt' ? '已复制差异 Prompt' : '复制差异 Prompt' }}
        </button>
      </section>

      <section v-else-if="activeView === 'recognize'" class="panel-view">
        <div class="section-head">
          <ImageUp :size="22" />
          <div>
            <h2>图片识别与手动拆解</h2>
            <p>当前先提供本地手动拆解入口，AI Key 接入后可增强候选判断。</p>
          </div>
        </div>
        <div class="recognize-layout">
          <label class="upload-box">
            <input type="file" accept="image/*" @change="onImageChange" />
            <img v-if="recognitionImage" :src="recognitionImage" alt="上传的界面截图" />
            <span v-else>上传截图</span>
          </label>
          <div class="recognition-workbench">
            <div class="recognition-status">{{ recognitionStatus }}</div>
            <div v-if="recognitionPalette.length" class="extracted-palette">
              <button
                v-for="color in recognitionPalette"
                :key="color"
                type="button"
                @click="copyText(`recognition-${color}`, color)"
              >
                <i :style="{ background: color }"></i>
                <code>{{ color }}</code>
              </button>
            </div>
            <textarea v-model="manualNote" placeholder="按 7 维度记录你的观察：形状、排版、光影、空间、动效、色彩、质感。"></textarea>
            <div class="tag-picker">
              <span>快速观察标签</span>
              <button
                v-for="tag in recommendationTagOptions"
                :key="tag"
                :class="{ active: recognitionTags.includes(tag) }"
                type="button"
                @click="toggleRecognitionTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <div class="result-list">
            <article
              v-for="{ style, score, confidence, matchedDimensions } in recognitionCandidates"
              :key="style.id"
              class="result-row recognition-row"
              :class="{ active: recognitionSelectedId === style.id }"
              @click="selectRecognitionCandidate(style)"
            >
              <StylePreview :style="style" compact />
              <div>
                <span>候选 · {{ score }} 分 · 置信度 {{ Math.round(confidence * 100) }}%</span>
                <h3>{{ style.nameZh }}</h3>
                <p>{{ style.tags.join('、') }}</p>
                <small>命中维度：{{ matchedDimensions.length ? matchedDimensions.map((key) => dimensionLabels[key]).join('、') : '等待人工标注' }}</small>
              </div>
              <button type="button" @click.stop="selectRecognitionCandidate(style)">选择</button>
            </article>
            <div v-if="!recognitionCandidates.length" class="empty-state compact-empty">
              <p>上传截图或选择观察标签后，这里会给出最接近的风格候选。</p>
            </div>
          </div>
          <div class="recognition-draft">
            <div>
              <h3>{{ recognitionDraft.title }}</h3>
              <p>{{ recognitionDraft.note }}</p>
            </div>
            <pre>{{ recognitionDraft.prompt }}</pre>
            <div class="action-row">
              <button type="button" @click="saveRecognition('learning')">保存为学习记录</button>
              <button type="button" @click="saveRecognition('draft')">保存为新风格草稿</button>
              <button type="button" @click="copyText('recognition-draft', recognitionDraft.prompt)">
                <Clipboard :size="16" />
                {{ copiedKey === 'recognition-draft' ? '已复制草稿' : '复制识别 Prompt' }}
              </button>
            </div>
          </div>
          <div v-if="recognitionRecords.length" class="recognition-history">
            <h3>最近识别记录</h3>
            <button
              v-for="record in recognitionRecords.slice(0, 4)"
              :key="record.id"
              type="button"
              @click="recognitionSelectedId = record.candidateId"
            >
              <span>{{ styles.find((style) => style.id === record.candidateId)?.nameZh }}</span>
              <small>{{ record.savedAs === 'learning' ? '学习记录' : '风格草稿' }} · {{ record.palette.join(' / ') || '未取色' }}</small>
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeView === 'mix'" class="panel-view">
        <div class="section-head">
          <Shuffle :size="22" />
          <div>
            <h2>风格混合器</h2>
            <p>选择 2 到 3 种风格，生成融合 Prompt 和变量草案。</p>
          </div>
        </div>
        <div class="mix-controls">
          <label>
            主导维度
            <select v-model="mixLeadDimension">
              <option v-for="key in dimensionKeys" :key="key" :value="key">{{ dimensionLabels[key] }}</option>
            </select>
          </label>
          <label>
            主风格权重
            <input v-model.number="mixWeight" type="range" min="45" max="85" step="5" />
            <strong>{{ mixWeight }}%</strong>
          </label>
        </div>
        <div class="chip-cloud">
          <button
            v-for="style in styles"
            :key="style.id"
            :class="{ active: mixIds.includes(style.id) }"
            type="button"
            @click="toggleMix(style)"
          >
            {{ style.nameZh }}
          </button>
        </div>
        <div class="mix-output">
          <h3>{{ mixedStyle.name }}</h3>
          <p>{{ mixedStyle.prompt }}</p>
          <pre>{{ JSON.stringify(mixedStyle.variables, null, 2) }}</pre>
          <button type="button" @click="copyText('mix', mixedStyle.prompt)">
            <Clipboard :size="16" />
            {{ copiedKey === 'mix' ? '已复制' : '复制融合 Prompt' }}
          </button>
        </div>
      </section>

      <section v-else-if="activeView === 'learn'" class="panel-view learn-view">
        <div class="section-head">
          <Brain :size="22" />
          <div>
            <h2>风格识别训练</h2>
            <p>用预览、特征、配色、CSS、差异和页面类型训练风格判断。</p>
          </div>
        </div>
        <div class="training-mode-switch">
          <button
            v-for="mode in trainingModes"
            :key="mode.key"
            :class="{ active: learnMode === mode.key }"
            type="button"
            @click="setLearnMode(mode.key)"
          >
            {{ mode.label }}
          </button>
        </div>
        <div class="learn-stats">
          <div>
            <span>已答题</span>
            <strong>{{ learningStats.total }}</strong>
          </div>
          <div>
            <span>正确率</span>
            <strong>{{ learningAccuracy }}%</strong>
          </div>
          <div>
            <span>错题</span>
            <strong>{{ learningStats.mistakes.length }}</strong>
          </div>
        </div>
        <StylePreview v-if="learnMode === 'preview'" :style="learningQuestion" :scenario="previewScenario" />
        <div v-else class="training-card">
          <h3>{{ learningPrompt.title }}</h3>
          <p>{{ learningPrompt.body }}</p>
          <div v-if="learnMode === 'palette'" class="training-palette">
            <i v-for="color in learningQuestion.colorPalette" :key="color.role" :style="{ background: color.hex }"></i>
          </div>
          <pre v-if="learnMode === 'css'">{{ learningQuestion.cssSnippets[0].code }}</pre>
          <div v-if="learnMode === 'difference'" class="training-compare">
            <StylePreview :style="learningQuestion" compact />
            <StylePreview :style="learningPair" compact />
          </div>
        </div>
        <select v-model="learnAnswer">
          <option value="">选择答案</option>
          <option v-for="option in learningOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <div class="learn-actions">
          <button type="button" @click="submitAnswer">提交</button>
          <button type="button" @click="nextQuestion">下一题</button>
        </div>
        <p v-if="learnResult === 'right'" class="feedback ok">答对了：{{ learningExplanation }}</p>
        <p v-if="learnResult === 'wrong'" class="feedback bad">答案是 {{ learningExpectedLabel }}。{{ learningExplanation }}</p>
        <div v-if="learningStats.mistakes.length" class="mistake-list">
          <h3>最近错题</h3>
          <span v-for="mistake in learningStats.mistakes" :key="`${mistake.expectedId}-${mistake.at}`">
            {{ learningAnswerLabel(mistake.expectedId) }} →
            {{ learningAnswerLabel(mistake.answerId) }}
          </span>
        </div>
      </section>

      <section v-else-if="activeView === 'favorites'" class="panel-view">
        <div class="section-head">
          <Heart :size="22" />
          <div>
            <h2>收藏夹</h2>
            <p>本地保存常用风格，刷新不丢失。</p>
          </div>
        </div>
        <div v-if="favoriteStyles.length" class="style-grid compact-grid">
          <article v-for="style in favoriteStyles" :key="style.id" class="style-card" @click="openStyle(style)">
            <StylePreview :style="style" compact />
            <div class="card-body">
              <span>{{ categoryLabels[style.category] }}</span>
              <h2>{{ style.nameZh }}</h2>
              <p>{{ style.summary }}</p>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <Star :size="28" />
          <p>还没有收藏。去图鉴里点心形按钮，把常用风格收进来。</p>
        </div>
      </section>

      <section v-else-if="activeView === 'export'" class="panel-view">
        <div class="section-head">
          <Download :size="22" />
          <div>
            <h2>数据与导出</h2>
            <p>JSON、CSS Variables、Tailwind 片段都从同一份风格数据生成。</p>
          </div>
        </div>
        <div class="export-grid">
          <div class="metric-card">
            <span>风格总数</span>
            <strong>{{ styles.length }}</strong>
          </div>
          <div class="metric-card">
            <span>分类</span>
            <strong>{{ Object.keys(categoryLabels).length }}</strong>
          </div>
          <div class="metric-card">
            <span>标签</span>
            <strong>{{ allTags.length }}</strong>
          </div>
          <div class="metric-card">
            <span>数据完整度</span>
            <strong>{{ dataQualityScore }}%</strong>
          </div>
        </div>
        <div class="export-actions">
          <button type="button" @click="downloadText('stylevault-all.json', exportPayload, 'application/json;charset=utf-8')">
            <Download :size="16" />
            全量 JSON
          </button>
          <button type="button" @click="downloadText(`${selectedStyle.id}.json`, selectedStyleJson, 'application/json;charset=utf-8')">
            <Download :size="16" />
            当前风格 JSON
          </button>
          <button type="button" @click="downloadText(`${selectedStyle.id}.css`, selectedStyleCss, 'text/css;charset=utf-8')">
            <Download :size="16" />
            CSS Variables
          </button>
          <button type="button" @click="downloadText(`${selectedStyle.id}.tailwind.js`, selectedStyleTailwind)">
            <Download :size="16" />
            Tailwind
          </button>
          <button type="button" @click="downloadText(`${selectedStyle.id}.prompt.md`, selectedStyle.promptTemplate)">
            <Download :size="16" />
            Prompt
          </button>
        </div>
        <div class="quality-table">
          <div class="quality-head">
            <strong>风格</strong>
            <strong>状态</strong>
            <strong>检查项</strong>
          </div>
          <div v-for="row in dataQualityRows" :key="row.style.id">
            <span>{{ row.style.nameZh }}</span>
            <strong :class="{ ok: !row.issues.length, bad: row.issues.length }">{{ row.status }}</strong>
            <span>{{ row.issues.length ? row.issues.join('；') : '7 维度、配色、Prompt、代码片段、笔记路径均已具备' }}</span>
          </div>
        </div>
        <pre class="code-block">{{ exportPayload.slice(0, 2400) }}...</pre>
        <button class="primary-action" type="button" @click="copyText('export-json', exportPayload)">
          <Clipboard :size="16" />
          {{ copiedKey === 'export-json' ? '已复制 JSON' : '复制全部 JSON' }}
        </button>
      </section>
  </main>
</template>
