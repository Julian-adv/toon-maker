<!-- Main component for generating images from prompts -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import ImageViewer from './ImageViewer.svelte'
  import PromptForm from './PromptForm.svelte'
  import GenerationControls from './GenerationControls.svelte'
  import type { Settings, PromptsData } from '$lib/types'
  import {
    savePrompts,
    loadPrompts,
    loadSettings,
    saveSettings as saveSettingsToFile
  } from './utils/fileIO'
  import { fetchCheckpoints } from './utils/comfyui'
  import { generateImage } from './utils/imageGeneration'
  import { DEFAULT_OUTPUT_DIRECTORY } from '$lib/constants'

  // Component state
  let isLoading = $state(false)
  let imageUrl: string | null = $state(null)
  let currentImageFileName = $state('')
  let progressData = $state({ value: 0, max: 100 })
  let availableCheckpoints: string[] = $state([])

  // Settings state
  let settings: Settings = $state({
    imageWidth: 832,
    imageHeight: 1216,
    cfgScale: 5,
    steps: 28,
    seed: -1,
    sampler: 'euler_ancestral',
    outputDirectory: DEFAULT_OUTPUT_DIRECTORY
  })

  // Prompts state
  let promptsData: PromptsData = $state({
    qualityValues: [],
    characterValues: [],
    outfitValues: [],
    poseValues: [],
    backgroundsValues: [],
    selectedCheckpoint: null,
    useUpscale: false,
    useFaceDetailer: false,
    qualityValue: '',
    characterValue: '',
    outfitValue: '',
    poseValue: '',
    backgroundsValue: ''
  })

  // Initialize component
  onMount(async () => {
    // Load saved prompts
    const savedPrompts = await loadPrompts()
    if (savedPrompts) {
      promptsData = savedPrompts
    }

    // Load settings
    const savedSettings = await loadSettings()
    if (savedSettings) {
      settings = savedSettings
    }

    // Load available checkpoints
    const checkpoints = await fetchCheckpoints()
    if (checkpoints && checkpoints.length > 0) {
      availableCheckpoints = checkpoints
      if (!promptsData.selectedCheckpoint && checkpoints.length > 0) {
        promptsData.selectedCheckpoint = checkpoints[0]
      }
    }
  })


  // Event handlers
  async function handleGenerate() {
    // Add current values to options if they're not already there
    const updated = { ...promptsData }
    
    if (updated.qualityValue && !updated.qualityValues.includes(updated.qualityValue)) {
      updated.qualityValues = [...updated.qualityValues, updated.qualityValue]
    }
    if (updated.characterValue && !updated.characterValues.includes(updated.characterValue)) {
      updated.characterValues = [...updated.characterValues, updated.characterValue]
    }
    if (updated.outfitValue && !updated.outfitValues.includes(updated.outfitValue)) {
      updated.outfitValues = [...updated.outfitValues, updated.outfitValue]
    }
    if (updated.poseValue && !updated.poseValues.includes(updated.poseValue)) {
      updated.poseValues = [...updated.poseValues, updated.poseValue]
    }
    if (updated.backgroundsValue && !updated.backgroundsValues.includes(updated.backgroundsValue)) {
      updated.backgroundsValues = [...updated.backgroundsValues, updated.backgroundsValue]
    }
    
    promptsData = updated
    
    // Save prompts before generating
    savePrompts(promptsData)
    
    await generateImage({
      promptsData,
      settings,
      onLoadingChange: (loading) => {
        isLoading = loading
      },
      onProgressUpdate: (progress) => {
        progressData = progress
      },
      onImageReceived: async (imageBlob) => {
        // Create blob URL for immediate display
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl)
        }
        imageUrl = URL.createObjectURL(imageBlob)
      },
      onError: (error) => {
        console.error('Generation error:', error)
        isLoading = false
      }
    })
  }

  function handlePromptsChange(newPromptsData: PromptsData) {
    promptsData = newPromptsData
  }

  function handleImageChange(filePath: string) {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
    imageUrl = `/api/image?path=${encodeURIComponent(filePath)}`
    currentImageFileName = filePath
  }

  function handleMetadataLoad(metadata: Partial<PromptsData>) {
    promptsData = { ...promptsData, ...metadata }
  }

  async function handleSettingsChange(newSettings: Settings) {
    settings = { ...newSettings }

    // Save settings to file
    const success = await saveSettingsToFile(settings)
    if (success) {
      console.log('Settings saved to file successfully')
    } else {
      console.error('Failed to save settings to file')
    }
  }

  // Cleanup
  onDestroy(() => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
  })
</script>

<main class="prompt-input">
  <div class="content-grid">
    <section class="form-section">
      <PromptForm 
        {promptsData}
        {availableCheckpoints}
        onPromptsChange={handlePromptsChange}
      />
      
      <GenerationControls
        {isLoading}
        {progressData}
        {settings}
        onGenerate={handleGenerate}
        onSettingsChange={handleSettingsChange}
      />
    </section>

    <section class="image-section">
      <ImageViewer
        {imageUrl}
        {currentImageFileName}
        outputDirectory={settings.outputDirectory}
        onImageChange={handleImageChange}
        onMetadataLoad={handleMetadataLoad}
      />
    </section>
  </div>
</main>

<style>
  .prompt-input {
    min-height: 100vh;
    padding: 1rem;
    background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr minmax(0, 832px);
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
    height: calc(100vh - 2rem);
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .form-section {
    min-width: 0;
  }

  .image-section {
    min-width: 0;
  }


  @media (max-width: 768px) {
    .prompt-input {
      padding: 1rem;
    }
    
  }
</style>