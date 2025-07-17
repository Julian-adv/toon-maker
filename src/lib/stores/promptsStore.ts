// Central store for prompts data using Svelte stores
import { writable } from 'svelte/store'
import type { PromptsData, PromptCategory, OptionItem } from '$lib/types'
import { savePrompts, loadPrompts } from '../utils/fileIO'

// Minimal default data for initial store state
const defaultPromptsData: PromptsData = {
  categories: [],
  selectedCheckpoint: null,
  useUpscale: false,
  useFaceDetailer: false
}

// Create reactive store
export const promptsData = writable<PromptsData>(defaultPromptsData)

// Load prompts from API on initialization
export async function initializePromptsStore() {
  const savedPrompts = await loadPrompts()
  if (savedPrompts) {
    promptsData.set(savedPrompts)
  } else {
    // If API fails, at least we have an empty structure
    console.warn('Failed to load prompts from API')
  }
}

// Save prompts to file
export async function savePromptsData() {
  let currentData: PromptsData
  promptsData.subscribe(data => currentData = data)()
  await savePrompts(currentData!)
}

// Helper functions for updating categories
export function updateCategoryValue(categoryId: string, value: import('../types').OptionItem) {
  promptsData.update(data => ({
    ...data,
    categories: data.categories.map(category =>
      category.id === categoryId
        ? { ...category, currentValue: value }
        : category
    )
  }))
}

export function updateCategoryValues(categoryId: string, values: import('../types').OptionItem[]) {
  promptsData.update(data => ({
    ...data,
    categories: data.categories.map(category =>
      category.id === categoryId
        ? { ...category, values: values }
        : category
    )
  }))
}

// Functions for managing categories themselves
export function addCategory(category: PromptCategory) {
  promptsData.update(data => ({
    ...data,
    categories: [...data.categories, category]
  }))
}

export function removeCategory(categoryId: string) {
  promptsData.update(data => ({
    ...data,
    categories: data.categories.filter(category => category.id !== categoryId)
  }))
}

export function updateCategory(categoryId: string, updates: Partial<PromptCategory>) {
  promptsData.update(data => ({
    ...data,
    categories: data.categories.map(category =>
      category.id === categoryId
        ? { ...category, ...updates }
        : category
    )
  }))
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

export function reorderCategories(fromIndex: number, toIndex: number) {
  promptsData.update(data => {
    const categories = [...data.categories]
    const [removed] = categories.splice(fromIndex, 1)
    categories.splice(toIndex, 0, removed)
    return { ...data, categories }
  })
}

// Get random option for a category
export function getRandomOption(categoryId: string): OptionItem | null {
  let randomOption: OptionItem | null = null
  promptsData.subscribe(data => {
    const category = data.categories.find(cat => cat.id === categoryId)
    if (category && category.values.length > 0) {
      // Filter out the random option itself to avoid infinite loop
      const realOptions = category.values.filter(option => option.title !== '[Random]')
      if (realOptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * realOptions.length)
        randomOption = realOptions[randomIndex]
      }
    }
  })()
  return randomOption
}

// Get effective value for a category (resolve random if needed)
export function getEffectiveCategoryValue(category: PromptCategory): string {
  if (category.currentValue.title === '[Random]') {
    const randomOption = getRandomOption(category.id)
    return randomOption?.value || ''
  }
  return category.currentValue.value
}

// Auto-save current values to options arrays when they don't exist
export function autoSaveCurrentValues() {
  promptsData.update(data => {
    const updated = { ...data }

    updated.categories = updated.categories.map(category => {
      if (category.currentValue && category.currentValue.title) {
        const existingOption = category.values.find(
          (item) => item.title === category.currentValue.title
        )
        if (existingOption) {
          existingOption.value = category.currentValue.value
        } else {
          return {
            ...category,
            values: [...category.values, { ...category.currentValue }]
          }
        }
      }
      return category
    })

    return updated
  })
}