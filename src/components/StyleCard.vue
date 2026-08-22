<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clipboard, GitCompare, Heart } from '@lucide/vue'
import type { DesignStyle } from '../types/style'
import {
  activeView,
  selectedStyle,
  compareLeft,
  compareRight,
  favorites,
  openStyle,
  toggleFavorite,
  copyText,
  copiedKey,
  categoryLabels,
} from '../store/vault'

const props = defineProps<{ style: DesignStyle }>()

const isFav = computed(() => favorites.value.includes(props.style.id))
const isActive = computed(() => {
  if (activeView.value === 'compare') {
    return compareLeft.value.id === props.style.id || compareRight.value.id === props.style.id
  }
  return selectedStyle.value.id === props.style.id
})
const p = computed(() => props.style.previewConfig)
const copyKey = computed(() => `card-prompt-${props.style.id}`)
</script>

<template>
  <article class="style-card" :class="{ active: isActive }">
    <button
      class="card-preview"
      type="button"
      :aria-label="`查看 ${style.nameZh} 详情`"
      :style="{ background: p.background }"
      @click="openStyle(style)"
    >
      <span
        class="card-surface"
        :style="{ background: p.surface, borderRadius: p.radius, boxShadow: p.shadow, border: p.border }"
      >
        <i :style="{ background: p.accent }"></i>
      </span>
    </button>

    <div class="card-body">
      <div class="card-title">
        <h3>{{ style.nameZh }}</h3>
        <span>{{ style.nameEn }}</span>
      </div>
      <div class="card-meta">
        <em>{{ categoryLabels[style.category] }}类</em>
        <i v-for="tag in style.tags.slice(0, 3)" :key="tag">{{ tag }}</i>
      </div>
    </div>

    <div class="card-actions">
      <button type="button" :title="isFav ? '取消收藏' : '收藏'" @click.stop="toggleFavorite(style)">
        <Heart :size="15" :fill="isFav ? 'currentColor' : 'none'" />
      </button>
      <button type="button" title="打开详情 / 加入对比" @click.stop="openStyle(style)">
        <GitCompare :size="15" />
      </button>
      <button type="button" title="复制 Prompt" @click.stop="copyText(copyKey, style.promptTemplate)">
        <Check v-if="copiedKey === copyKey" :size="15" />
        <Clipboard v-else :size="15" />
      </button>
    </div>
  </article>
</template>
