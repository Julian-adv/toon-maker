<!-- Component for displaying images with navigation and metadata loading -->
<script lang="ts">
  import { getImageList, getImageMetadata } from './utils/fileIO'
  import type { PromptsData, OptionItem } from '$lib/types'

  interface Props {
    imageUrl: string | null
    currentImageFileName: string
    outputDirectory: string
    promptsData: PromptsData
    onImageChange: (filePath: string) => void
    onMetadataLoad: (metadata: PromptsData) => void
  }

  let {
    imageUrl,
    currentImageFileName,
    outputDirectory,
    promptsData,
    onImageChange,
    onMetadataLoad
  }: Props = $props()

  let allFiles: string[] = $state([])
  let currentIndex = $state(-1)

  // Watch for outputDirectory changes and update file list
  $effect(() => {
    if (outputDirectory) {
      updateFileList()
    }
  })

  // Update file list and current index
  export async function updateFileList() {
    allFiles = await getImageList(outputDirectory)
    if (currentImageFileName) {
      currentIndex = allFiles.indexOf(currentImageFileName)
    } else {
      // If no current image but files exist, load the latest one
      if (allFiles.length > 0 && !currentImageFileName) {
        const latestFile = allFiles[allFiles.length - 1]
        await updateImage(latestFile)
        return
      }
      currentIndex = -1
    }
  }


  // Navigation functions
  async function goToPreviousImage() {
    await updateFileList()
    if (allFiles.length === 0) return

    if (!currentImageFileName) {
      // If no current image, show the latest file
      const latestFile = allFiles[allFiles.length - 1]
      await updateImage(latestFile)
      return
    }

    const currentIndex = allFiles.indexOf(currentImageFileName)
    if (currentIndex > 0) {
      const previousFile = allFiles[currentIndex - 1]
      await updateImage(previousFile)
    }
  }

  async function goToNextImage() {
    await updateFileList()
    if (allFiles.length === 0) return

    if (!currentImageFileName) {
      // If no current image, show the first file
      const firstFile = allFiles[0]
      await updateImage(firstFile)
      return
    }

    const currentIndex = allFiles.indexOf(currentImageFileName)
    if (currentIndex !== -1 && currentIndex < allFiles.length - 1) {
      const nextFile = allFiles[currentIndex + 1]
      await updateImage(nextFile)
    }
  }

  async function updateImage(filePath: string) {
    onImageChange(filePath)
    await loadImageMetadata(filePath)
    await updateFileList()
  }

  async function loadImageMetadata(filePath: string) {
    try {
      const metadata = await getImageMetadata(filePath) as { parameters?: string }
      
      if (metadata && metadata.parameters) {
        // Parse metadata to extract categorized prompts
        const params = metadata.parameters as string
        
        const qualityMatch = params.match(/Quality: ([^\n]*)/)?.[1]?.trim()
        const characterMatch = params.match(/Character: ([^\n]*)/)?.[1]?.trim()
        const outfitMatch = params.match(/Outfit: ([^\n]*)/)?.[1]?.trim()
        const poseMatch = params.match(/Pose: ([^\n]*)/)?.[1]?.trim()
        const backgroundsMatch = params.match(/Backgrounds: ([^\n]*)/)?.[1]?.trim()
        
        // Helper function to find matching option and create proper OptionItem
        function findOrCreateOption(matchedValue: string, optionsArray: OptionItem[]): OptionItem {
          const existingOption = optionsArray.find(item => item.value === matchedValue)
          if (existingOption) {
            return { title: existingOption.title, value: existingOption.value }
          }
          // If not found, create with value as title
          return { title: matchedValue, value: matchedValue }
        }

        // Create updated prompts data
        const updatedPrompts: Partial<PromptsData> = {}
        if (qualityMatch) updatedPrompts.qualityValue = findOrCreateOption(qualityMatch, promptsData.qualityValues)
        if (characterMatch) updatedPrompts.characterValue = findOrCreateOption(characterMatch, promptsData.characterValues)
        if (outfitMatch) updatedPrompts.outfitValue = findOrCreateOption(outfitMatch, promptsData.outfitValues)
        if (poseMatch) updatedPrompts.poseValue = findOrCreateOption(poseMatch, promptsData.poseValues)
        if (backgroundsMatch) updatedPrompts.backgroundsValue = findOrCreateOption(backgroundsMatch, promptsData.backgroundsValues)
        
        onMetadataLoad(updatedPrompts as PromptsData)
      }
    } catch (error) {
      console.error('Failed to load image metadata:', error)
    }
  }
</script>

<div class="image-viewer">
  {#if imageUrl}
    <img src={imageUrl} alt="" class="main-image" />
  {:else}
    <div class="placeholder">
      <p>No image to display</p>
    </div>
  {/if}
  
  <div class="nav-controls">
    <button class="nav-button prev" onclick={goToPreviousImage} aria-label="Previous image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <span class="image-counter">
      {currentIndex >= 0 ? currentIndex + 1 : 0} / {allFiles.length}
    </span>
    
    <button class="nav-button next" onclick={goToNextImage} aria-label="Next image">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .image-viewer {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }


  .nav-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .image-counter {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
  }

  .main-image {
    max-width: 100%;
    max-height: calc(100vh - 2rem);
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 50%;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #ddd;
  }

  .nav-button:hover {
    background: #e8e8e8;
    border-color: #bbb;
    transform: scale(1.05);
  }

  .nav-button:active {
    transform: scale(0.95);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 832px;
    height: 1216px;
    background: #f5f5f5;
    border-radius: 8px;
    color: #666;
    font-size: 1.1rem;
  }
</style>