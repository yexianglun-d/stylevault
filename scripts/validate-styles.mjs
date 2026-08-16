import { access } from 'node:fs/promises'
import path from 'node:path'
import { loadStyleModule } from './style-data-loader.mjs'

const projectRoot = process.cwd()
const { styles, dimensionLabels } = await loadStyleModule(projectRoot)
const dimensionKeys = Object.keys(dimensionLabels)
const errors = []

function requireField(condition, message) {
  if (!condition) errors.push(message)
}

for (const style of styles) {
  requireField(style.id && /^[a-z0-9-]+$/.test(style.id), `${style.id || '(missing id)'}: id 必须是 kebab-case`)
  requireField(style.nameZh && style.nameEn, `${style.id}: 缺少中英文名称`)
  requireField(style.summary, `${style.id}: 缺少 summary`)
  requireField(style.visualFeatures.length >= 3, `${style.id}: visualFeatures 少于 3 条`)
  requireField(style.colorPalette.length >= 4, `${style.id}: colorPalette 少于 4 个 token`)
  requireField(style.tags.length >= 5, `${style.id}: tags 少于 5 个`)
  requireField(style.pageTypes.length > 0, `${style.id}: 缺少 pageTypes`)
  requireField(style.useCases.length > 0, `${style.id}: 缺少 useCases`)
  requireField(style.avoidCases.length > 0, `${style.id}: 缺少 avoidCases`)
  requireField(style.promptTemplate, `${style.id}: 缺少 promptTemplate`)
  requireField(style.cssSnippets.length > 0, `${style.id}: 缺少 cssSnippets`)
  requireField(Object.keys(style.cssVariables).length > 0, `${style.id}: 缺少 cssVariables`)
  requireField(Object.keys(style.tailwindTheme).length > 0, `${style.id}: 缺少 tailwindTheme`)
  requireField(style.notesPath === `docs/styles/${style.id}.md`, `${style.id}: notesPath 不符合规范`)

  for (const key of dimensionKeys) {
    requireField(style.formCharacteristics[key]?.tags?.length > 0, `${style.id}: 缺少 ${dimensionLabels[key]} 维度标签`)
    requireField(style.formCharacteristics[key]?.description, `${style.id}: 缺少 ${dimensionLabels[key]} 维度描述`)
  }

  try {
    await access(path.join(projectRoot, style.notesPath))
  } catch {
    errors.push(`${style.id}: 缺少 Markdown 笔记 ${style.notesPath}`)
  }
}

if (errors.length) {
  console.error(`StyleVault validation failed with ${errors.length} issue(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`StyleVault validation passed: ${styles.length} styles, ${dimensionKeys.length} dimensions each.`)
