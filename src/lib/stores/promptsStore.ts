// Central store for prompts data using Svelte stores
import { writable } from 'svelte/store'
import type { PromptsData } from '$lib/types'
import { savePrompts, loadPrompts } from '../utils/fileIO'

// Initialize with default values
const defaultPromptsData: PromptsData = {
  qualityValues: [],
  characterValues: [],
  outfitValues: [],
  poseValues: [],
  backgroundsValues: [],
  selectedCheckpoint: null,
  useUpscale: false,
  useFaceDetailer: false,
  qualityValue: { title: '', value: '' },
  characterValue: { title: '', value: '' },
  outfitValue: { title: '', value: '' },
  poseValue: { title: '', value: '' },
  backgroundsValue: { title: '', value: '' }
}

// Create reactive store
export const promptsData = writable<PromptsData>(defaultPromptsData)

// Load prompts from file on initialization
export async function initializePromptsStore() {
  const savedPrompts = await loadPrompts()
  if (savedPrompts) {
    promptsData.set(savedPrompts)
  }
}

// Save prompts to file
export async function savePromptsData() {
  let currentData: PromptsData
  promptsData.subscribe(data => currentData = data)()
  await savePrompts(currentData!)
}

// Helper functions for updating specific parts of the store
export function updateQualityValue(value: import('../types').OptionItem) {
  promptsData.update(data => ({ ...data, qualityValue: value }))
}

export function updateCharacterValue(value: import('../types').OptionItem) {
  promptsData.update(data => ({ ...data, characterValue: value }))
}

export function updateOutfitValue(value: import('../types').OptionItem) {
  promptsData.update(data => ({ ...data, outfitValue: value }))
}

export function updatePoseValue(value: import('../types').OptionItem) {
  promptsData.update(data => ({ ...data, poseValue: value }))
}

export function updateBackgroundsValue(value: import('../types').OptionItem) {
  promptsData.update(data => ({ ...data, backgroundsValue: value }))
}

export function updateQualityValues(values: import('../types').OptionItem[]) {
  promptsData.update(data => ({ ...data, qualityValues: values }))
}

export function updateCharacterValues(values: import('../types').OptionItem[]) {
  promptsData.update(data => ({ ...data, characterValues: values }))
}

export function updateOutfitValues(values: import('../types').OptionItem[]) {
  promptsData.update(data => ({ ...data, outfitValues: values }))
}

export function updatePoseValues(values: import('../types').OptionItem[]) {
  promptsData.update(data => ({ ...data, poseValues: values }))
}

export function updateBackgroundsValues(values: import('../types').OptionItem[]) {
  promptsData.update(data => ({ ...data, backgroundsValues: values }))
}

export function updateCheckpoint(checkpoint: string) {
  promptsData.update(data => ({ ...data, selectedCheckpoint: checkpoint }))
}

export function updateUpscale(enabled: boolean) {
  promptsData.update(data => ({ ...data, useUpscale: enabled }))
}

export function updateFaceDetailer(enabled: boolean) {
  promptsData.update(data => ({ ...data, useFaceDetailer: enabled }))
}

// Auto-save current values to options arrays when they don't exist
export function autoSaveCurrentValues() {
  promptsData.update(data => {
    const updated = { ...data }

    if (updated.qualityValue) {
      const existingOption = updated.qualityValues.find(
        (item) => item.title === updated.qualityValue.title
      )
      if (existingOption) {
        existingOption.value = updated.qualityValue.value
      } else {
        updated.qualityValues.push({ ...updated.qualityValue })
      }
    }

    if (updated.characterValue) {
      const existingOption = updated.characterValues.find(
        (item) => item.title === updated.characterValue.title
      )
      if (existingOption) {
        existingOption.value = updated.characterValue.value
      } else {
        updated.characterValues.push({ ...updated.characterValue })
      }
    }

    if (updated.outfitValue) {
      const existingOption = updated.outfitValues.find(
        (item) => item.title === updated.outfitValue.title
      )
      if (existingOption) {
        existingOption.value = updated.outfitValue.value
      } else {
        updated.outfitValues.push({ ...updated.outfitValue })
      }
    }

    if (updated.poseValue) {
      const existingOption = updated.poseValues.find(
        (item) => item.title === updated.poseValue.title
      )
      if (existingOption) {
        existingOption.value = updated.poseValue.value
      } else {
        updated.poseValues.push({ ...updated.poseValue })
      }
    }

    if (updated.backgroundsValue) {
      const existingOption = updated.backgroundsValues.find(
        (item) => item.title === updated.backgroundsValue.title
      )
      if (existingOption) {
        existingOption.value = updated.backgroundsValue.value
      } else {
        updated.backgroundsValues.push({ ...updated.backgroundsValue })
      }
    }

    return updated
  })
}