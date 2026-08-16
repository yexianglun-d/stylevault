export type StyleCategory = 'minimal' | 'texture' | 'retro' | 'future' | 'experimental'

export type PageType =
  | 'login'
  | 'register'
  | 'saas-landing'
  | 'portfolio'
  | 'admin'
  | 'dashboard'
  | 'ai-tool'
  | 'developer-tool'
  | 'mobile-home'
  | 'campaign'
  | 'pricing'
  | 'docs'

export type DimensionKey =
  | 'shape'
  | 'typography'
  | 'lighting'
  | 'space'
  | 'motion'
  | 'color'
  | 'texture'

export type PreviewScenario =
  | 'card'
  | 'form'
  | 'dashboard'
  | 'marketing'
  | 'navigation'
  | 'list'
  | 'pricing'
  | 'article'
  | 'appHome'
  | 'appDetail'
  | 'miniProgram'
  | 'miniForm'

export interface FormDimension {
  tags: string[]
  description: string
}

export interface ColorToken {
  role: string
  name: string
  hex: string
  opacity?: number
}

export interface CssSnippet {
  title: string
  code: string
}

export interface PreviewConfig {
  background: string
  surface: string
  text: string
  accent: string
  radius: string
  shadow: string
  border: string
}

export interface DesignStyle {
  id: string
  nameZh: string
  nameEn: string
  category: StyleCategory
  summary: string
  visualFeatures: string[]
  formCharacteristics: Record<DimensionKey, FormDimension>
  colorPalette: ColorToken[]
  pageTypes: PageType[]
  useCases: string[]
  avoidCases: string[]
  aiKeywords: string
  promptTemplate: string
  cssSnippets: CssSnippet[]
  cssVariables: Record<string, string>
  tailwindTheme: Record<string, unknown>
  previewConfig: PreviewConfig
  references: string[]
  tags: string[]
  density: 'low' | 'medium' | 'high'
  visualIntensity: 'restrained' | 'balanced' | 'expressive'
  implementationCost: 'low' | 'medium' | 'high'
  notesPath: string
}

export interface RecommendationPreference {
  pageType: PageType
  tone: 'any' | 'dark' | 'light'
  density: 'any' | 'low' | 'medium' | 'high'
  intensity: 'any' | 'restrained' | 'balanced' | 'expressive'
  tags: string[]
}
