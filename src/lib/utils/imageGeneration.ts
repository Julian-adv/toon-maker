// Image generation utility functions
//
// This module orchestrates the complete image generation workflow with ComfyUI

import { saveImage } from './fileIO'
import { connectWebSocket, type WebSocketCallbacks } from './comfyui'
import { defaultWorkflowPrompt, FINAL_SAVE_NODE_ID } from './workflow'
import { getEffectiveCategoryValueFromResolved } from '../stores/promptsStore'
import type { PromptsData, Settings, ProgressData, OptionItem, PromptCategory } from '$lib/types'

/**
 * Replaces category reference patterns like {categoryName} with their resolved values
 */
function replaceCategoryReferences(
  promptValue: string,
  positiveCategories: PromptCategory[],
  resolvedRandomValues: Record<string, OptionItem>
): string {
  const categoryReferencePattern = /\{([^}]+)\}/g
  return promptValue.replace(categoryReferencePattern, (match, categoryName) => {
    const categoryNameLower = categoryName.toLowerCase()

    // Find category by name (case insensitive) from all positive categories
    const referencedCategory = positiveCategories.find(
      (cat) => cat.name.toLowerCase() === categoryNameLower
    )

    if (referencedCategory) {
      const resolvedValue = getEffectiveCategoryValueFromResolved(
        referencedCategory,
        resolvedRandomValues
      )
      return resolvedValue || ''
    }

    // If category not found, return the original pattern
    return match
  })
}

// Workflow node interfaces
interface WorkflowNodeInput {
  [key: string]: string | number | boolean | [string, number] | undefined
}

interface WorkflowNode {
  inputs: WorkflowNodeInput
  class_type: string
  _meta?: {
    title?: string
  }
}

interface ComfyUIWorkflow {
  [nodeId: string]: WorkflowNode
}

export interface GenerationOptions {
  promptsData: PromptsData
  settings: Settings
  resolvedRandomValues: Record<string, OptionItem>
  onLoadingChange: (loading: boolean) => void
  onProgressUpdate: (progress: ProgressData) => void
  onImageReceived: (imageBlob: Blob, filePath: string) => void
  onError: (error: string) => void
  onCategoriesDisabled?: (excludedCategories: PromptCategory[]) => void
}

export async function generateImage(options: GenerationOptions): Promise<void> {
  const {
    promptsData,
    settings,
    resolvedRandomValues,
    onLoadingChange,
    onProgressUpdate,
    onImageReceived,
    onError,
    onCategoriesDisabled
  } = options

  try {
    // Separate negative category from positive categories
    const negativeCategory = promptsData.categories.find((cat) => cat.id === 'negative')
    const positiveCategories = promptsData.categories.filter((cat) => cat.id !== 'negative')

    // Build the combined positive prompt from dynamic categories (using resolved random values)
    // First pass: build initial prompt value
    let firstPassPromptValue = positiveCategories
      .map((category) => getEffectiveCategoryValueFromResolved(category, resolvedRandomValues))
      .filter(Boolean)
      .join(', ')

    // Second pass: replace {category name} patterns with resolved random values
    firstPassPromptValue = replaceCategoryReferences(
      firstPassPromptValue,
      positiveCategories,
      resolvedRandomValues
    )

    // Third pass: remove categories that match -[category] patterns
    let promptValue = firstPassPromptValue
    const categoryRemovalPattern = /-\[([^\]]+)\]/g
    let match
    const categoriesToRemove: string[] = []

    // Find all -[category] patterns
    while ((match = categoryRemovalPattern.exec(firstPassPromptValue)) !== null) {
      const categoryNameToRemove = match[1].toLowerCase()
      categoriesToRemove.push(categoryNameToRemove)
    }

    // Remove values from matching categories
    if (categoriesToRemove.length > 0) {
      const filteredCategories: PromptCategory[] = []
      const excludedCategories: PromptCategory[] = []

      // Single loop to categorize all categories
      positiveCategories.forEach((category) => {
        const categoryName = category.name.toLowerCase()
        let isExcluded = false

        // Check if category name matches directly
        if (categoriesToRemove.includes(categoryName)) {
          isExcluded = true
        }
        // Check if this category is an alias of a category to remove
        // else if (category.aliasOf) {
        //   const aliasTarget = positiveCategories.find((cat) => cat.id === category.aliasOf)
        //   if (aliasTarget && categoriesToRemove.includes(aliasTarget.name.toLowerCase())) {
        //     isExcluded = true
        //   }
        // }

        if (isExcluded) {
          excludedCategories.push(category)
        } else {
          filteredCategories.push(category)
        }
      })

      // Notify about excluded categories for UI feedback
      if (excludedCategories.length > 0 && onCategoriesDisabled) {
        onCategoriesDisabled(excludedCategories)
      }

      console.log(
        'filteredCategories:\n' +
          filteredCategories
            .map(
              (cat) =>
                `  ${cat.name}: ${getEffectiveCategoryValueFromResolved(cat, resolvedRandomValues)}`
            )
            .join('\n')
      )

      // Rebuild prompt without the excluded categories
      promptValue = filteredCategories
        .map((category) => getEffectiveCategoryValueFromResolved(category, resolvedRandomValues))
        .filter(Boolean)
        .join(', ')
        .replace(categoryRemovalPattern, '') // Remove any remaining -[category] patterns
        .trim()

      // Apply category reference replacement to the rebuilt prompt
      promptValue = replaceCategoryReferences(promptValue, positiveCategories, resolvedRandomValues)
    }

    // Build the negative prompt
    const negativePrompt = negativeCategory
      ? getEffectiveCategoryValueFromResolved(negativeCategory, resolvedRandomValues)
      : ''

    if (!promptValue.trim()) {
      onError('Prompt is empty')
      return
    }

    onLoadingChange(true)
    onProgressUpdate({ value: 0, max: 100, currentNode: '' })

    // Generate unique client ID
    const clientId = crypto.randomUUID()

    // Clone the default workflow
    const workflow = JSON.parse(JSON.stringify(defaultWorkflowPrompt))

    // Split promptValue by [SEP] for regional prompting
    const promptParts = promptValue.split('[SEP]').map(part => part.trim()).filter(Boolean)
    
    // Assign prompts to different nodes
    if (promptParts.length >= 1) {
      workflow['12'].inputs.text = promptParts[0] // Overall base prompt
    }
    if (promptParts.length >= 2) {
      workflow['13'].inputs.text = promptParts[1] // Left side prompt
    }
    if (promptParts.length >= 3) {
      workflow['51'].inputs.text = promptParts[2] // Right side prompt
    }
    
    // Set negative prompt
    workflow['18'].inputs.text = negativePrompt

    // Configure workflow based on settings
    configureWorkflow(workflow, promptsData, settings)

    // Apply random seeds
    applySeedsToWorkflow(workflow)

    // Add SaveImageWebsocket node for output
    addSaveImageWebsocketNode(workflow, promptsData)

    // Submit to ComfyUI
    await submitToComfyUI(workflow, clientId, promptsData, settings, resolvedRandomValues, {
      onLoadingChange,
      onProgressUpdate,
      onImageReceived,
      onError
    })
  } catch (error) {
    console.error('Failed to generate image:', error)
    onError(error instanceof Error ? error.message : 'Failed to generate image')
    onLoadingChange(false)
  }
}

function configureWorkflow(
  workflow: ComfyUIWorkflow,
  promptsData: PromptsData,
  settings: Settings
) {
  // Set checkpoint
  if (promptsData.selectedCheckpoint) {
    workflow['11'].inputs.ckpt_name = promptsData.selectedCheckpoint
  }

  // Apply settings values to workflow
  workflow['45'].inputs.steps = settings.steps
  workflow['14'].inputs.cfg = settings.cfgScale
  workflow['15'].inputs.sampler_name = settings.sampler
  workflow['16'].inputs.width = settings.imageWidth
  workflow['16'].inputs.height = settings.imageHeight

  // Configure optional features
  if (promptsData.useUpscale) {
    // Enable upscale nodes if they exist
    if (workflow['64']) {
      // Upscale is handled by ImageUpscaleWithModel node
    }
  }

  if (promptsData.useFaceDetailer) {
    // Face detailer nodes are already in the workflow (56, 69)
    // They are enabled by default in this workflow
  }
}

function applySeedsToWorkflow(workflow: ComfyUIWorkflow) {
  // Apply random seed to relevant nodes
  const seed = Math.floor(Math.random() * 10000000000000000)

  // Set seed for SamplerCustom node
  workflow['14'].inputs.noise_seed = seed

  // Set seed for BasicScheduler
  if (workflow['45']) {
    // BasicScheduler doesn't have a seed input, it's controlled by SamplerCustom
  }

  // Set seed for FaceDetailer nodes
  if (workflow['56']) {
    workflow['56'].inputs.seed = seed + 1
  }

  if (workflow['69']) {
    workflow['69'].inputs.seed = seed + 2
  }
}

function addSaveImageWebsocketNode(workflow: ComfyUIWorkflow, promptsData: PromptsData) {
  // Determine which node to use as image source based on upscale and face detailer settings
  let imageSourceNodeId: string

  if (promptsData.useUpscale) {
    if (promptsData.useFaceDetailer) {
      // Upscale=true, FaceDetailer=true
      imageSourceNodeId = '69' // Output of second FaceDetailer after upscale
    } else {
      // Upscale=true, FaceDetailer=false
      imageSourceNodeId = '64' // Output of ImageUpscaleWithModel
    }
  } else {
    // Upscale=false
    if (promptsData.useFaceDetailer) {
      // Upscale=false, FaceDetailer=true
      imageSourceNodeId = '56' // Output of first FaceDetailer
    } else {
      // Upscale=false, FaceDetailer=false
      imageSourceNodeId = '19' // Output of VAE Decode
    }
  }

  // Add the single, dynamically configured SaveImageWebsocket node
  workflow[FINAL_SAVE_NODE_ID] = {
    inputs: { images: [imageSourceNodeId, 0] }, // Assuming output index 0
    class_type: 'SaveImageWebsocket',
    _meta: { title: 'Final Save Image Websocket' }
  }
}

async function submitToComfyUI(
  workflow: ComfyUIWorkflow,
  clientId: string,
  promptsData: PromptsData,
  settings: Settings,
  resolvedRandomValues: Record<string, OptionItem>,
  callbacks: {
    onLoadingChange: (loading: boolean) => void
    onProgressUpdate: (progress: ProgressData) => void
    onImageReceived: (imageBlob: Blob, filePath: string) => void
    onError: (error: string) => void
  }
) {
  const payload = {
    prompt: workflow,
    client_id: clientId
  }

  // Submit prompt to ComfyUI
  const response = await fetch('http://127.0.0.1:8188/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('ComfyUI API Error:', response.status, errorText)
    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
  }

  const result = await response.json()

  // Connect to WebSocket for real-time updates
  const wsCallbacks: WebSocketCallbacks = {
    onLoadingChange: callbacks.onLoadingChange,
    onProgressUpdate: callbacks.onProgressUpdate,
    onImageReceived: async (imageBlob: Blob) => {
      const filePath = await saveImage(
        imageBlob,
        promptsData,
        settings.outputDirectory,
        workflow,
        resolvedRandomValues
      )
      if (filePath) {
        callbacks.onImageReceived(imageBlob, filePath)
      } else {
        // If saving returns null, use fallback path
        const fallbackPath = `unsaved_${Date.now()}.png`
        callbacks.onImageReceived(imageBlob, fallbackPath)
      }
    },
    onError: callbacks.onError
  }

  await connectWebSocket(result.prompt_id, clientId, FINAL_SAVE_NODE_ID, workflow, wsCallbacks)
}
