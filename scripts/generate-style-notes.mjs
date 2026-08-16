import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadStyleModule } from './style-data-loader.mjs'

const projectRoot = process.cwd()
const notesDir = path.join(projectRoot, 'docs', 'styles')
const { styles, categoryLabels, dimensionLabels, pageTypeLabels } = await loadStyleModule(projectRoot)

function lines(items) {
  return items.map((item) => `- ${item}`).join('\n')
}

function dimensionBlock(style) {
  return Object.entries(style.formCharacteristics)
    .map(([key, value]) => `- ${dimensionLabels[key]}：${value.tags.join('、')}。${value.description}`)
    .join('\n')
}

function paletteBlock(style) {
  return style.colorPalette.map((color) => `- ${color.role} / ${color.name}：${color.hex}`).join('\n')
}

function noteFor(style) {
  return `# ${style.nameZh} / ${style.nameEn}

## 一句话理解

${style.summary}

## 适合什么页面

${lines(style.pageTypes.map((pageType) => pageTypeLabels[pageType]))}

## 不适合什么页面

${lines(style.avoidCases)}

## 7 维度拆解

${dimensionBlock(style)}

## 配色方案

${paletteBlock(style)}

## CSS 实现要点

${lines(style.cssSnippets.map((snippet) => `${snippet.title}：\`${snippet.code}\``))}

## AI Prompt 写法

${style.promptTemplate}

关键词：${style.aiKeywords}

## 常见错误

- 只套用颜色，没有同步 ${Object.values(style.formCharacteristics)
    .flatMap((dimension) => dimension.tags)
    .slice(0, 4)
    .join('、')} 等形态特征。
- 在 ${style.avoidCases.slice(0, 2).join('、')} 场景里强行使用，导致可读性或维护成本下降。
- Prompt 只写风格名，没有写清楚配色、圆角、阴影、排版、动效和 CSS 方向。

## 我的使用记录

- 分类：${categoryLabels[style.category]}
- 信息密度：${style.density}
- 视觉强度：${style.visualIntensity}
- 实现成本：${style.implementationCost}
- 标签：${style.tags.join('、')}
`
}

await mkdir(notesDir, { recursive: true })
await Promise.all(styles.map((style) => writeFile(path.join(notesDir, `${style.id}.md`), noteFor(style), 'utf8')))
console.log(`Generated ${styles.length} style notes in docs/styles`)
