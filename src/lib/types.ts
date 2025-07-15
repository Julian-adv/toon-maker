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

export interface PromptsData {
  qualityValues: OptionItem[]
  characterValues: OptionItem[]
  outfitValues: OptionItem[]
  poseValues: OptionItem[]
  backgroundsValues: OptionItem[]
  selectedCheckpoint: string | null
  useUpscale: boolean
  useFaceDetailer: boolean
  qualityValue: OptionItem
  characterValue: OptionItem
  outfitValue: OptionItem
  poseValue: OptionItem
  backgroundsValue: OptionItem
}

export interface ProgressData {
  value: number
  max: number
  currentNode: string
}