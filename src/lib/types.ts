// Common type definitions used across the application

export interface OptionItem {
  title: string
  value: string
}

export interface Settings {
  imageWidth: number
  imageHeight: number
  cfgScale: number
  steps: number
  seed: number
  sampler: string
  outputDirectory: string
}

export interface PromptCategory {
  id: string
  name: string
  values: OptionItem[]
  currentValue: OptionItem
}

export interface PromptsData {
  categories: PromptCategory[]
  selectedCheckpoint: string | null
  useUpscale: boolean
  useFaceDetailer: boolean
}

export interface ProgressData {
  value: number
  max: number
  currentNode: string
}