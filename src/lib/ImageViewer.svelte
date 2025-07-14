<!-- Component for displaying images with navigation and metadata loading -->
<script lang="ts">
  import { getImageList, getImageMetadata } from './utils/fileIO'
  import type { PromptsData } from '$lib/types'

  interface Props {
    imageUrl: string | null
    currentImageFileName: string
    outputDirectory: string
    onImageChange: (filePath: string) => void
    onMetadataLoad: (metadata: PromptsData) => void
  }

  let {
    imageUrl,
    currentImageFileName,
    outputDirectory,
    onImageChange,
    onMetadataLoad
  }: Props = $props()

  // Navigation functions
  async function goToPreviousImage() {
    const allFiles = await getImageList(outputDirectory)
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
    const allFiles = await getImageList(outputDirectory)
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
        
        // Create updated prompts data
        const updatedPrompts: Partial<PromptsData> = {}
        if (qualityMatch) updatedPrompts.qualityValue = qualityMatch
        if (characterMatch) updatedPrompts.characterValue = characterMatch
        if (outfitMatch) updatedPrompts.outfitValue = outfitMatch
        if (poseMatch) updatedPrompts.poseValue = poseMatch
        if (backgroundsMatch) updatedPrompts.backgroundsValue = backgroundsMatch
        
        onMetadataLoad(updatedPrompts as PromptsData)
      }
    } catch (error) {
      console.error('Failed to load image metadata:', error)
    }
  }
</script>

<div class="image-viewer">
  {#if imageUrl}
    <div class="image-container">
      <button class="nav-button prev" onclick={goToPreviousImage} aria-label="Previous image">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <img src={imageUrl} alt="" class="main-image" />
      
      <button class="nav-button next" onclick={goToNextImage} aria-label="Next image">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  {:else}
    <div class="placeholder">
      <p>No image to display</p>
    </div>
  {/if}
</div>

<style>
  .image-viewer {
    width: 100%;
    margin: 0 auto;
  }

  .image-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-image {
    max-width: 100%;
    max-height: calc(100vh - 2rem);
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .nav-button {
    position: absolute;
    bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.025);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }

  .nav-button.prev {
    left: 1rem;
  }

  .nav-button.next {
    right: 1rem;
  }

  .nav-button:hover {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    transform: scale(1.1);
  }

  .nav-button:active {
    transform: scale(0.95);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
    background: #f5f5f5;
    border-radius: 8px;
    color: #666;
    font-size: 1.1rem;
  }
</style>