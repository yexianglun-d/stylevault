<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Star, Clipboard } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import type { DesignStyle, StyleCategory } from '../../types/style'
import {
  favoriteStyles,
  categoryLabels,
  openStyle,
  favoriteNotes,
  setFavoriteNote,
  recentCopies,
} from '../../store/vault'

const groupedFavorites = computed(() => {
  const groups = new Map<StyleCategory, DesignStyle[]>()
  for (const style of favoriteStyles.value) {
    const list = groups.get(style.category) ?? []
    list.push(style)
    groups.set(style.category, list)
  }
  return Array.from(groups.entries()).map(([category, list]) => ({
    category,
    label: `${categoryLabels[category]}类`,
    list,
  }))
})

function copyTimeLabel(at: string) {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <section class="panel-view">
    <div class="section-head">
      <Heart :size="22" />
      <div>
        <h2>收藏夹</h2>
        <p>本地保存常用风格，刷新不丢失；可给每个收藏加个人备注。</p>
      </div>
    </div>

    <template v-if="favoriteStyles.length">
      <div v-for="group in groupedFavorites" :key="group.category" class="favorite-group">
        <h3 class="favorite-group-title">{{ group.label }} <span>{{ group.list.length }}</span></h3>
        <div class="style-grid compact-grid">
          <article v-for="style in group.list" :key="style.id" class="style-card">
            <div @click="openStyle(style)">
              <StylePreview :style="style" compact />
              <div class="card-body">
                <span>{{ categoryLabels[style.category] }}</span>
                <h2>{{ style.nameZh }}</h2>
                <p>{{ style.summary }}</p>
              </div>
            </div>
            <input
              class="fav-note"
              type="text"
              placeholder="个人备注（如：登录页就用它）"
              :value="favoriteNotes[style.id] ?? ''"
              @change="setFavoriteNote(style.id, ($event.target as HTMLInputElement).value)"
            />
          </article>
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <Star :size="28" />
      <p>还没有收藏。去图鉴里点心形按钮，把常用风格收进来。</p>
    </div>

    <div v-if="recentCopies.length" class="recent-copies">
      <h3 class="favorite-group-title"><Clipboard :size="16" /> 最近复制</h3>
      <ul>
        <li v-for="(item, i) in recentCopies" :key="`${item.key}-${i}`">
          <code>{{ item.key }}</code>
          <span>{{ copyTimeLabel(item.at) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
