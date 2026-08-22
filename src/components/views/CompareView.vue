<script setup lang="ts">
import { GitCompare, Clipboard, ArrowLeftRight } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import {
  compareSlot,
  compareLeft,
  compareRight,
  compareLeftId,
  compareRightId,
  styles,
  categoryLabels,
  dimensionLabels,
  copyText,
  copiedKey,
} from '../../store/vault'

function swapCompare() {
  const tmp = compareLeftId.value
  compareLeftId.value = compareRightId.value
  compareRightId.value = tmp
}
</script>

<template>
  <section class="compare-board">
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
      <button class="swap-btn" type="button" title="交换 A/B 两侧" @click="swapCompare">
        <ArrowLeftRight :size="15" />
        交换 A/B
      </button>
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
</template>
