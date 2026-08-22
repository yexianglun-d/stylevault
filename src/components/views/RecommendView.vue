<script setup lang="ts">
import { Sparkles, Clipboard } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import {
  recommendation,
  recommendedStyles,
  recommendationReason,
  recommendationTagOptions,
  toggleRecommendationTag,
  pageTypeLabels,
  categoryLabels,
  copyText,
} from '../../store/vault'
</script>

<template>
  <section class="panel-view">
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
</template>
