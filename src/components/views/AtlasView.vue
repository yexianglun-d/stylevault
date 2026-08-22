<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clipboard, Heart, Wand2 } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import StyleCard from '../StyleCard.vue'
import {
  selectedStyle,
  resolvedStyle,
  previewScenario,
  scenarioOptions,
  detailSection,
  detailSections,
  similarStyles,
  filteredStyles,
  query,
  activeCategory,
  activeTag,
  activePageType,
  overrides,
  PARAM_RANGES,
  resetTune,
  intentQuery,
  matchedIntents,
  applyIntent,
  topIntents,
  applyProfileDefault,
  clearProfile,
  copyText,
  copiedKey,
  favorites,
  toggleFavorite,
  selectedStyleCss,
  selectedStyleTailwind,
  openStyle,
  categoryLabels,
  pageTypeLabels,
  dimensionLabels,
} from '../../store/vault'
import { inferIntents } from '../../data/intent'
import { defaultOverrides } from '../../data/parametric'

function clearFilters() {
  query.value = ''
  activeCategory.value = 'all'
  activeTag.value = 'all'
  activePageType.value = 'all'
}

const baseOverrides = computed(() => defaultOverrides(selectedStyle.value))
const inferredIntents = computed(() => inferIntents(baseOverrides.value, overrides.value))

const maxIntentCount = computed(() => topIntents.value.reduce((max, item) => Math.max(max, item.count), 0) || 1)
function profileBarWidth(count: number) {
  return `${Math.round((count / maxIntentCount.value) * 100)}%`
}
</script>

<template>
  <div class="atlas-view">
    <div v-if="filteredStyles.length" class="style-grid">
      <StyleCard v-for="style in filteredStyles" :key="style.id" :style="style" />
    </div>
    <div v-else class="empty-state">
      <p>没有找到匹配的风格。</p>
      <button type="button" @click="clearFilters">清除筛选</button>
    </div>

    <section class="atlas-board">
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
      <StylePreview :style="resolvedStyle" :scenario="previewScenario" />
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
        <p class="prompt-text">{{ resolvedStyle.promptTemplate }}</p>
        <div class="action-row">
          <button type="button" @click="copyText('selected-prompt', resolvedStyle.promptTemplate)">
            <Check v-if="copiedKey === 'selected-prompt'" :size="16" />
            <Clipboard v-else :size="16" />
            {{ copiedKey === 'selected-prompt' ? '已复制 Prompt' : '复制 Prompt' }}
          </button>
          <button type="button" @click="copyText('selected-keywords', selectedStyle.aiKeywords)">
            <Check v-if="copiedKey === 'selected-keywords'" :size="16" />
            <Clipboard v-else :size="16" />
            {{ copiedKey === 'selected-keywords' ? '已复制关键词' : '关键词' }}
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

      <article v-else-if="detailSection === 'tune'" class="info-card">
        <h3>参数微调</h3>
        <p class="prompt-text">{{ resolvedStyle.promptTemplate }}</p>

        <div class="intent-translator">
          <label class="intent-label">
            <Wand2 :size="15" />
            <span>说一句模糊的词，翻译成参数</span>
          </label>
          <input v-model="intentQuery" type="text" class="intent-input" placeholder="试试：更活泼 / 高级感 / 科技感 / 温暖…" />
          <div class="intent-chips">
            <button
              v-for="term in matchedIntents"
              :key="term.id"
              type="button"
              class="intent-chip"
              :title="term.description"
              @click="applyIntent(term.id)"
            >
              {{ term.term }}
            </button>
          </div>
        </div>

        <div class="tune-list">
          <div v-for="(cfg, key) in PARAM_RANGES" :key="key" class="tune-row">
            <label>
              <span>{{ cfg.label }} <small>{{ cfg.hint }}</small></span>
              <code>{{ overrides[key] }}{{ cfg.unit }}</code>
            </label>
            <input type="range" :min="cfg.min" :max="cfg.max" :step="cfg.step" v-model.number="overrides[key]" />
          </div>
        </div>
        <div class="action-row">
          <button type="button" @click="resetTune">重置为风格默认</button>
        </div>

        <div v-if="inferredIntents.length" class="loop-check">
          <span class="loop-label">闭环验证 · 系统读回意图</span>
          <div class="loop-tags">
            <span v-for="item in inferredIntents" :key="item.term.id" class="loop-tag">
              {{ item.term.term }}
              <i>{{ Math.round(item.score * 100) }}%</i>
            </span>
          </div>
          <p class="loop-hint">正向翻译（词→参数）与反向识别（参数→词）共用一本词典，高置信度说明链路自洽。</p>
        </div>
      </article>

      <article v-else-if="detailSection === 'profile'" class="info-card">
        <h3>我的审美画像</h3>
        <p class="prompt-text">记录你常用的意图词，沉淀成个人审美指纹。</p>
        <div v-if="topIntents.length" class="profile-list">
          <div v-for="item in topIntents" :key="item.term.id" class="profile-row">
            <span class="profile-term">{{ item.term.term }}</span>
            <span class="profile-bar"><i :style="{ width: profileBarWidth(item.count) }"></i></span>
            <code>{{ item.count }} 次</code>
          </div>
        </div>
        <p v-else class="loop-hint">还没有数据。去「参数」分节点几个意图词试试。</p>
        <div class="action-row">
          <button type="button" :disabled="!topIntents.length" @click="applyProfileDefault">应用我的偏好</button>
          <button type="button" :disabled="!topIntents.length" @click="clearProfile">清空画像</button>
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
  </div>
</template>
