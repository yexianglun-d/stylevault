<script setup lang="ts">
import { computed } from 'vue'
import { Download, Clipboard } from '@lucide/vue'
import {
  styles,
  categoryLabels,
  allTags,
  dataQualityScore,
  exportPayload,
  selectedStyleJson,
  selectedStyleCss,
  selectedStyleTailwind,
  selectedStyle,
  downloadText,
  dataQualityRows,
  copyText,
  copiedKey,
} from '../../store/vault'

const notesCoverage = computed(() => {
  const withNotes = styles.filter((style) => style.notesPath.trim().length > 0)
  const missing = styles.filter((style) => !style.notesPath.trim().length)
  return { count: withNotes.length, total: styles.length, missing }
})
</script>

<template>
  <section class="panel-view">
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
      <div class="metric-card">
        <span>Markdown 笔记覆盖</span>
        <strong>{{ notesCoverage.count }}/{{ notesCoverage.total }}</strong>
      </div>
    </div>
    <p v-if="notesCoverage.missing.length" class="notes-missing">
      缺笔记：{{ notesCoverage.missing.map((style) => style.nameZh).join('、') }}
    </p>
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
</template>
