// Image generation utility functions
//
// This module orchestrates the complete image generation workflow with ComfyUI

import { saveImage } from './fileIO'
import { connectWebSocket, type WebSocketCallbacks } from './comfyui'
import { defaultWorkflowPrompt, FINAL_SAVE_NODE_ID } from './workflow'
import type { PromptsData, Settings, ProgressData } from '$lib/types'

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
  onLoadingChange: (loading: boolean) => void
  onProgressUpdate: (progress: ProgressData) => void
  onImageReceived: (imageBlob: Blob, filePath: string) => void
  onError: (error: string) => void
}

export async function generateImage(options: GenerationOptions): Promise<void> {
  const { promptsData, settings, onLoadingChange, onProgressUpdate, onImageReceived, onError } =
    options

  try {
    // Build the combined prompt
    const promptValue = [
      promptsData.qualityValue,
      promptsData.characterValue,
      promptsData.outfitValue,
      promptsData.poseValue,
      promptsData.backgroundsValue
    ]
      .filter(Boolean)
      .join(', ')

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

    // Update workflow with prompts
    workflow['11'].inputs.text = promptValue

    // Configure workflow based on settings
    configureWorkflow(workflow, promptsData, settings)

    // Apply random seeds
    applySeedsToWorkflow(workflow)

    // Add SaveImageWebsocket node for output
    addSaveImageWebsocketNode(workflow, promptsData)

    // Submit to ComfyUI
    await submitToComfyUI(workflow, clientId, promptsData, settings, {
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
    workflow['10'].inputs.ckpt_name = promptsData.selectedCheckpoint
  }

  // Apply settings values to workflow
  workflow['8'].inputs.steps = settings.steps
  workflow['8'].inputs.cfg = settings.cfgScale
  workflow['8'].inputs.sampler_name = settings.sampler
  workflow['9'].inputs.width = settings.imageWidth
  workflow['9'].inputs.height = settings.imageHeight

  // Configure optional features
  if (promptsData.useUpscale) {
    // Enable upscale nodes if they exist
    if (workflow['17']) {
      workflow['17'].inputs.enabled = true
    }
  }

  if (promptsData.useFaceDetailer) {
    // Enable face detailer nodes if they exist
    if (workflow['18']) {
      workflow['18'].inputs.enabled = true
    }
  }
}

function applySeedsToWorkflow(workflow: ComfyUIWorkflow) {
  // Apply random seed to relevant KSamplers
  const seed = Math.floor(Math.random() * 10000000000000000)
  workflow['8'].inputs.seed = seed

  if (workflow['17']) {
    workflow['17'].inputs.seed = seed + 1
  }
}

function addSaveImageWebsocketNode(workflow: ComfyUIWorkflow, promptsData: PromptsData) {
  // Determine which node to use as image source based on upscale and face detailer settings
  let imageSourceNodeId: string

  if (promptsData.useUpscale) {
    if (promptsData.useFaceDetailer) {
      // Upscale=true, FaceDetailer=true
      imageSourceNodeId = '22' // Output of FaceDetailer2
    } else {
      // Upscale=true, FaceDetailer=false
      imageSourceNodeId = '15' // Output of upscaled VAE Decode ('15')
    }
  } else {
    // Upscale=false
    if (promptsData.useFaceDetailer) {
      // Upscale=false, FaceDetailer=true
      imageSourceNodeId = '5' // Output of FaceDetailer1
    } else {
      // Upscale=false, FaceDetailer=false
      imageSourceNodeId = '18' // Output of non-upscaled VAE Decode ('18')
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

  console.log('Sending payload to ComfyUI:', JSON.stringify(payload, null, 2))

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
  console.log('Prompt submitted successfully:', result)

  // Connect to WebSocket for real-time updates
  const wsCallbacks: WebSocketCallbacks = {
    onLoadingChange: callbacks.onLoadingChange,
    onProgressUpdate: callbacks.onProgressUpdate,
    onImageReceived: async (imageBlob: Blob) => {
      const filePath = await saveImage(imageBlob, promptsData, settings.outputDirectory, workflow)
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
