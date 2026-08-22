<script setup lang="ts">
import { Brain } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import {
  trainingModes,
  learnMode,
  setLearnMode,
  learningStats,
  learningAccuracy,
  previewScenario,
  learningQuestion,
  learningPrompt,
  learningPair,
  learningOptions,
  learnAnswer,
  submitAnswer,
  nextQuestion,
  learnResult,
  learningExplanation,
  learningExpectedLabel,
  learningAnswerLabel,
} from '../../store/vault'
</script>

<template>
  <section class="panel-view learn-view">
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
</template>
