<script setup lang="ts">
import { ImageUp, Clipboard } from '@lucide/vue'
import StylePreview from '../StylePreview.vue'
import {
  recognitionImage,
  onImageChange,
  recognitionStatus,
  recognitionPalette,
  copyText,
  manualNote,
  recommendationTagOptions,
  recognitionTags,
  toggleRecognitionTag,
  recognitionCandidates,
  recognitionSelectedId,
  selectRecognitionCandidate,
  recognitionDraft,
  saveRecognition,
  recognitionRecords,
  styles,
  dimensionLabels,
  copiedKey,
} from '../../store/vault'
</script>

<template>
  <section class="panel-view">
    <div class="section-head">
      <ImageUp :size="22" />
      <div>
        <h2>图片识别与手动拆解</h2>
        <p>当前先提供本地手动拆解入口，AI Key 接入后可增强候选判断。</p>
      </div>
    </div>
    <div class="recognize-layout">
      <label class="upload-box">
        <input type="file" accept="image/*" @change="onImageChange" />
        <img v-if="recognitionImage" :src="recognitionImage" alt="上传的界面截图" />
        <span v-else>上传截图</span>
      </label>
      <div class="recognition-workbench">
        <div class="recognition-status">{{ recognitionStatus }}</div>
        <div v-if="recognitionPalette.length" class="extracted-palette">
          <button
            v-for="color in recognitionPalette"
            :key="color"
            type="button"
            @click="copyText(`recognition-${color}`, color)"
          >
            <i :style="{ background: color }"></i>
            <code>{{ color }}</code>
          </button>
        </div>
        <textarea v-model="manualNote" placeholder="按 7 维度记录你的观察：形状、排版、光影、空间、动效、色彩、质感。"></textarea>
        <div class="tag-picker">
          <span>快速观察标签</span>
          <button
            v-for="tag in recommendationTagOptions"
            :key="tag"
            :class="{ active: recognitionTags.includes(tag) }"
            type="button"
            @click="toggleRecognitionTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
      <div class="result-list">
        <article
          v-for="{ style, score, confidence, matchedDimensions } in recognitionCandidates"
          :key="style.id"
          class="result-row recognition-row"
          :class="{ active: recognitionSelectedId === style.id }"
          @click="selectRecognitionCandidate(style)"
        >
          <StylePreview :style="style" compact />
          <div>
            <span>候选 · {{ score }} 分 · 置信度 {{ Math.round(confidence * 100) }}%</span>
            <h3>{{ style.nameZh }}</h3>
            <p>{{ style.tags.join('、') }}</p>
            <small>命中维度：{{ matchedDimensions.length ? matchedDimensions.map((key) => dimensionLabels[key]).join('、') : '等待人工标注' }}</small>
          </div>
          <button type="button" @click.stop="selectRecognitionCandidate(style)">选择</button>
        </article>
        <div v-if="!recognitionCandidates.length" class="empty-state compact-empty">
          <p>上传截图或选择观察标签后，这里会给出最接近的风格候选。</p>
        </div>
      </div>
      <div class="recognition-draft">
        <div>
          <h3>{{ recognitionDraft.title }}</h3>
          <p>{{ recognitionDraft.note }}</p>
        </div>
        <pre>{{ recognitionDraft.prompt }}</pre>
        <div class="action-row">
          <button type="button" @click="saveRecognition('learning')">保存为学习记录</button>
          <button type="button" @click="saveRecognition('draft')">保存为新风格草稿</button>
          <button type="button" @click="copyText('recognition-draft', recognitionDraft.prompt)">
            <Clipboard :size="16" />
            {{ copiedKey === 'recognition-draft' ? '已复制草稿' : '复制识别 Prompt' }}
          </button>
        </div>
      </div>
      <div v-if="recognitionRecords.length" class="recognition-history">
        <h3>最近识别记录</h3>
        <button
          v-for="record in recognitionRecords.slice(0, 4)"
          :key="record.id"
          type="button"
          @click="recognitionSelectedId = record.candidateId"
        >
          <span>{{ styles.find((style) => style.id === record.candidateId)?.nameZh }}</span>
          <small>{{ record.savedAs === 'learning' ? '学习记录' : '风格草稿' }} · {{ record.palette.join(' / ') || '未取色' }}</small>
        </button>
      </div>
    </div>
  </section>
</template>
