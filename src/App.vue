<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@lucide/vue'
import {
  activeView,
  query,
  activeCategory,
  categoryLabels,
  allTags,
  activeTag,
  activePageType,
  pageTypeLabels,
  filteredStyles,
  selectedStyle,
  compareLeft,
  compareRight,
  openStyle,
  loadState,
  views,
  styles,
} from './store/vault'
import AtlasView from './components/views/AtlasView.vue'
import RecommendView from './components/views/RecommendView.vue'
import CompareView from './components/views/CompareView.vue'
import RecognizeView from './components/views/RecognizeView.vue'
import MixView from './components/views/MixView.vue'
import LearnView from './components/views/LearnView.vue'
import FavoritesView from './components/views/FavoritesView.vue'
import ExportView from './components/views/ExportView.vue'

const viewMap = {
  atlas: AtlasView,
  recommend: RecommendView,
  compare: CompareView,
  recognize: RecognizeView,
  mix: MixView,
  learn: LearnView,
  favorites: FavoritesView,
  export: ExportView,
}
const currentView = computed(() => viewMap[activeView.value])

// 还原本地存储（收藏 / 历史 / 选中 / 训练统计 / 识别记录）
loadState()
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
      <select v-model="activePageType" aria-label="页面类型筛选">
        <option value="all">全部页面</option>
        <option v-for="(label, key) in pageTypeLabels" :key="key" :value="key">{{ label }}</option>
      </select>
    </section>

    <div v-if="activeView !== 'atlas'" class="style-tabs" aria-label="风格列表">
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

    <component :is="currentView" />
  </main>
</template>
