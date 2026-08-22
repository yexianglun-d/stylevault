<script setup lang="ts">
import { Shuffle, Clipboard, Save } from '@lucide/vue'
import {
  mixLeadDimension,
  dimensionKeys,
  dimensionLabels,
  mixWeight,
  mixIds,
  toggleMix,
  styles,
  mixedStyle,
  copyText,
  copiedKey,
  saveMixDraft,
  mixDrafts,
} from '../../store/vault'
</script>

<template>
  <section class="panel-view">
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
      <div class="action-row">
        <button type="button" @click="copyText('mix', mixedStyle.prompt)">
          <Clipboard :size="16" />
          {{ copiedKey === 'mix' ? '已复制' : '复制融合 Prompt' }}
        </button>
        <button type="button" @click="saveMixDraft">
          <Save :size="16" />
          存为草稿
        </button>
      </div>
    </div>

    <div v-if="mixDrafts.length" class="mix-drafts">
      <h3 class="favorite-group-title">混合草稿（{{ mixDrafts.length }}）</h3>
      <div v-for="draft in mixDrafts" :key="draft.id" class="mix-draft">
        <div class="mix-draft-head">
          <strong>{{ draft.name }}</strong>
          <button type="button" @click="copyText(`draft-${draft.id}`, draft.prompt)">
            <Clipboard :size="14" />
            {{ copiedKey === `draft-${draft.id}` ? '已复制' : '复制' }}
          </button>
        </div>
        <p>{{ draft.prompt }}</p>
      </div>
    </div>
  </section>
</template>
