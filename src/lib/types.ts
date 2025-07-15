// Common type definitions used across the application

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
  qualityValues: string[]
  characterValues: string[]
  outfitValues: string[]
  poseValues: string[]
  backgroundsValues: string[]
  selectedCheckpoint: string | null
  useUpscale: boolean
  useFaceDetailer: boolean
  qualityValue: string
  characterValue: string
  outfitValue: string
  poseValue: string
  backgroundsValue: string
}

export interface ProgressData {
  value: number
  max: number
  currentNode: string
}