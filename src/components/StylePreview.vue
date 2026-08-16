<script setup lang="ts">
import type { DesignStyle, PreviewScenario } from '../types/style'

withDefaults(defineProps<{
  style: DesignStyle
  compact?: boolean
  scenario?: PreviewScenario
}>(), {
  scenario: 'card',
})
</script>

<template>
  <div
    class="style-preview"
    :class="[{ compact }, `scenario-${scenario}`]"
    :style="{
      '--preview-bg': style.previewConfig.background,
      '--preview-surface': style.previewConfig.surface,
      '--preview-text': style.previewConfig.text,
      '--preview-accent': style.previewConfig.accent,
      '--preview-radius': style.previewConfig.radius,
      '--preview-shadow': style.previewConfig.shadow,
      '--preview-border': style.previewConfig.border,
    }"
  >
    <div class="preview-grid" aria-hidden="true"></div>
    <div v-if="scenario === 'card'" class="preview-panel">
      <div class="preview-head">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="preview-title">{{ style.nameEn }}</div>
      <div class="preview-bars">
        <i></i>
        <i></i>
        <i></i>
      </div>
      <div class="preview-actions">
        <b></b>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'form'" class="preview-panel preview-form">
      <div class="preview-title">{{ style.nameZh }}</div>
      <label>
        <span>Project name</span>
        <i></i>
      </label>
      <label>
        <span>Style intent</span>
        <i></i>
      </label>
      <div class="preview-actions">
        <b></b>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'dashboard'" class="preview-dashboard">
      <div class="dash-main">
        <div class="preview-title">{{ style.nameEn }}</div>
        <div class="preview-bars">
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
      <div class="dash-side">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="dash-card"></div>
      <div class="dash-card"></div>
    </div>

    <div v-else-if="scenario === 'marketing'" class="preview-marketing">
      <small>{{ style.category }}</small>
      <div class="preview-title">{{ style.nameZh }}</div>
      <p>{{ style.summary }}</p>
      <div class="preview-actions">
        <b></b>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'navigation'" class="preview-navigation">
      <div class="nav-rail">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="nav-content">
        <div class="preview-title">{{ style.nameZh }}</div>
        <div class="preview-bars">
          <i></i>
          <i></i>
        </div>
      </div>
    </div>

    <div v-else-if="scenario === 'list'" class="preview-list">
      <div class="preview-title">{{ style.nameEn }}</div>
      <div v-for="index in 4" :key="index" class="list-row">
        <span></span>
        <i></i>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'pricing'" class="preview-pricing">
      <div class="price-card">
        <small>Starter</small>
        <strong>¥29</strong>
        <i></i>
        <i></i>
        <b></b>
      </div>
      <div class="price-card featured">
        <small>Pro</small>
        <strong>¥99</strong>
        <i></i>
        <i></i>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'article'" class="preview-article">
      <small>STYLE NOTE</small>
      <div class="preview-title">{{ style.nameZh }}</div>
      <div class="preview-bars">
        <i></i>
        <i></i>
        <i></i>
      </div>
      <div class="article-meta">
        <span></span>
        <span></span>
      </div>
    </div>

    <div v-else-if="scenario === 'appHome'" class="preview-phone">
      <div class="phone-status">
        <span></span>
        <i></i>
      </div>
      <div class="phone-hero">
        <small>APP HOME</small>
        <strong>{{ style.nameZh }}</strong>
      </div>
      <div class="phone-grid">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="phone-tabbar">
        <i></i>
        <i></i>
        <i></i>
      </div>
    </div>

    <div v-else-if="scenario === 'appDetail'" class="preview-phone app-detail">
      <div class="phone-status">
        <span></span>
        <i></i>
      </div>
      <div class="phone-media"></div>
      <div class="phone-sheet">
        <strong>{{ style.nameEn }}</strong>
        <i></i>
        <i></i>
        <b></b>
      </div>
    </div>

    <div v-else-if="scenario === 'miniProgram'" class="preview-mini">
      <div class="mini-topbar">
        <span></span>
        <i></i>
      </div>
      <div class="mini-search"></div>
      <div class="mini-cards">
        <span></span>
        <span></span>
      </div>
      <div class="mini-list">
        <i></i>
        <i></i>
        <i></i>
      </div>
    </div>

    <div v-else class="preview-mini mini-form">
      <div class="mini-topbar">
        <span></span>
        <i></i>
      </div>
      <strong>{{ style.nameZh }}</strong>
      <label>
        <span></span>
        <i></i>
      </label>
      <label>
        <span></span>
        <i></i>
      </label>
      <b></b>
    </div>
  </div>
</template>
