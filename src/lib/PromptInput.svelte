<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import TextAreaInput from './TextAreaInput.svelte'
  import SettingsDialog from './SettingsDialog.svelte'
  import { savePrompts, saveImage, loadPrompts, getImageList } from './utils/fileIO'
  import type { PromptsData } from './utils/fileIO'
  import { fetchCheckpoints, connectWebSocket, type WebSocketCallbacks } from './utils/comfyui'
  import { defaultWorkflowPrompt, FINAL_SAVE_NODE_ID } from './utils/workflow'

  let isLoading: boolean = $state(false)
  let imageUrl: string | null = $state(null)
  let currentPromptId: string | null = $state(null)
  let clientId: string = ''
  let progressData: { value: number; max: number } = $state({ value: 0, max: 100 })
  let availableCheckpoints: string[] = $state([])
  let currentPromptText: string = ''

  // Image navigation state
  let currentImageFileName: string = $state('') // Current image filename

  // Settings dialog state
  let showSettingsDialog: boolean = $state(false)
  let settings = $state({
    imageWidth: 832,
    imageHeight: 1216,
    cfgScale: 5,
    steps: 28,
    seed: -1,
    sampler: 'euler_ancestral'
  })

  let promptsData: PromptsData = $state({
    qualityValues: [],
    characterValues: [],
    outfitValues: [],
    poseValues: [],
    backgroundsValues: [],
    selectedCheckpoint: null,
    useUpscale: true,
    useFaceDetailer: true,
    qualityValue: '',
    characterValue: '',
    outfitValue: '',
    poseValue: '',
    backgroundsValue: ''
  })

  onMount(async () => {
    const data = await loadPrompts()
    if (data) {
      promptsData = { ...promptsData, ...data }
    }
    const checkpoints = await fetchCheckpoints()
    if (checkpoints && checkpoints.length > 0) {
      availableCheckpoints = checkpoints
      if (
        !promptsData.selectedCheckpoint ||
        !checkpoints.includes(promptsData.selectedCheckpoint)
      ) {
        promptsData.selectedCheckpoint = checkpoints[0] // Default to the first checkpoint if invalid or not set
      }
    } else {
      availableCheckpoints = []
      promptsData.selectedCheckpoint = null
    }
  })

  async function handleSubmit() {
    if (promptsData.qualityValue && !promptsData.qualityValues.includes(promptsData.qualityValue)) {
      promptsData.qualityValues = [...promptsData.qualityValues, promptsData.qualityValue]
    }
    if (
      promptsData.characterValue &&
      !promptsData.characterValues.includes(promptsData.characterValue)
    ) {
      promptsData.characterValues = [...promptsData.characterValues, promptsData.characterValue]
    }
    if (promptsData.outfitValue && !promptsData.outfitValues.includes(promptsData.outfitValue)) {
      promptsData.outfitValues = [...promptsData.outfitValues, promptsData.outfitValue]
    }
    if (promptsData.poseValue && !promptsData.poseValues.includes(promptsData.poseValue)) {
      promptsData.poseValues = [...promptsData.poseValues, promptsData.poseValue]
    }
    if (
      promptsData.backgroundsValue &&
      !promptsData.backgroundsValues.includes(promptsData.backgroundsValue)
    ) {
      promptsData.backgroundsValues = [
        ...promptsData.backgroundsValues,
        promptsData.backgroundsValue
      ]
    }

    savePrompts(promptsData) // Save all updated values to the server

    let promptValue = [
      promptsData.qualityValue,
      promptsData.characterValue,
      promptsData.outfitValue,
      promptsData.poseValue,
      promptsData.backgroundsValue
    ]
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(', ')

    if (!promptValue.trim()) {
      console.log('Prompt is empty')
      return
    }

    // Store current prompt for use in image saving
    currentPromptText = promptValue

    isLoading = true
    progressData.value = 0
    progressData.max = 100 // Reset progress on new submission
    clientId = crypto.randomUUID() // Generate a new client ID for this session

    console.log('Submitting prompt:', promptValue, 'Client ID:', clientId)

    const workflow = JSON.parse(JSON.stringify(defaultWorkflowPrompt))

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

    workflow['11'].inputs.text = promptValue

    // Dynamically set the checkpoint in the workflow for this specific submission
    if (promptsData.selectedCheckpoint) {
      workflow['10'].inputs.ckpt_name = promptsData.selectedCheckpoint
    } else {
      // Fallback or error handling if no checkpoint is selected
      console.error('No checkpoint selected. Using the default checkpoint defined in workflow.')
    }
    // Apply random seed to relevant KSamplers
    workflow['8'].inputs.seed = Math.floor(Math.random() * 10000000000000000) // KSampler 1
    if (workflow['17']) {
      // KSampler 2 (post-upscale)
      workflow['17'].inputs.seed = Math.floor(Math.random() * 10000000000000000)
    }

    const payload = {
      prompt: workflow,
      client_id: clientId
    }

    try {
      const response = await fetch('http://127.0.0.1:8188/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error from ComfyUI API:', response.status, errorData)
        isLoading = false
      } else {
        const responseData = await response.json()
        console.log('Successfully queued prompt to ComfyUI:', responseData)
        if (responseData.prompt_id) {
          currentPromptId = responseData.prompt_id

          const callbacks: WebSocketCallbacks = {
            onLoadingChange: (loading) => {
              isLoading = loading
            },
            onProgressUpdate: (progress) => {
              progressData = progress
            },
            onImageReceived: async (imageBlob) => {
              const fileName = await saveImage(imageBlob, currentPromptText)
              if (fileName) {
                setCurrentImage(fileName)
              } else {
                // Fallback to blob URL if save failed
                if (imageUrl && imageUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(imageUrl)
                }
                imageUrl = URL.createObjectURL(imageBlob)
                currentImageFileName = '' // Reset filename since we're using blob
              }
            }
          }

          connectWebSocket(
            responseData.prompt_id,
            clientId,
            currentPromptId,
            FINAL_SAVE_NODE_ID,
            callbacks
          )
          // isLoading remains true until WebSocket gives image or error
        } else {
          console.error('Prompt ID not found in response:', responseData)
          isLoading = false
        }
      }
    } catch (error) {
      console.error('Failed to send prompt to ComfyUI:', error)
      isLoading = false
    }
    // isLoading is managed by WebSocket flow now
  }

  // Cleanup on component destroy
  // Navigation functions
  async function goToPreviousImage() {
    const allFiles = await getImageList()
    if (allFiles.length === 0) return

    if (!currentImageFileName) {
      // If no current image, show the latest file
      const latestFile = allFiles[allFiles.length - 1]
      updateImageUrl(latestFile)
      return
    }

    const currentIndex = allFiles.indexOf(currentImageFileName)
    if (currentIndex > 0) {
      const previousFile = allFiles[currentIndex - 1]
      updateImageUrl(previousFile)
    }
  }

  async function goToNextImage() {
    const allFiles = await getImageList()
    if (allFiles.length === 0) return

    if (!currentImageFileName) {
      // If no current image, show the first file
      const firstFile = allFiles[0]
      updateImageUrl(firstFile)
      return
    }

    const currentIndex = allFiles.indexOf(currentImageFileName)
    if (currentIndex !== -1 && currentIndex < allFiles.length - 1) {
      const nextFile = allFiles[currentIndex + 1]
      updateImageUrl(nextFile)
    }
  }

  function updateImageUrl(fileName: string) {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
    imageUrl = `/api/image?path=${encodeURIComponent(fileName)}`
    currentImageFileName = fileName
  }

  function setCurrentImage(fileName: string) {
    updateImageUrl(fileName)
  }

  // Settings dialog functions
  function openSettingsDialog() {
    showSettingsDialog = true
  }

  function closeSettingsDialog() {
    showSettingsDialog = false
  }

  function saveSettings(newSettings: typeof settings) {
    settings = { ...newSettings }
    // You could add validation or API calls here if needed
    showSettingsDialog = false
  }

  onDestroy(() => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
  })
</script>

<div class="content-container">
  <div class="content-wrapper">
    <div class="input-container">
      <TextAreaInput
        id="quality-prompt"
        label="Quality"
        bind:value={promptsData.qualityValue}
        placeholder="Enter quality details..."
        rows={5}
        options={promptsData.qualityValues}
        bind:selectedValue={promptsData.qualityValue}
      />
      <TextAreaInput
        id="character-prompt"
        label="Character"
        bind:value={promptsData.characterValue}
        placeholder="Describe the character..."
        rows={5}
        options={promptsData.characterValues}
        bind:selectedValue={promptsData.characterValue}
      />
      <TextAreaInput
        id="outfit-prompt"
        label="Outfit"
        bind:value={promptsData.outfitValue}
        placeholder="Describe the outfit..."
        rows={5}
        options={promptsData.outfitValues}
        bind:selectedValue={promptsData.outfitValue}
      />
      <TextAreaInput
        id="pose-prompt"
        label="Pose"
        bind:value={promptsData.poseValue}
        placeholder="Describe the pose..."
        rows={5}
        options={promptsData.poseValues}
        bind:selectedValue={promptsData.poseValue}
      />
      <TextAreaInput
        id="backgrounds-prompt"
        label="Backgrounds"
        bind:value={promptsData.backgroundsValue}
        placeholder="Describe the background..."
        rows={5}
        options={promptsData.backgroundsValues}
        bind:selectedValue={promptsData.backgroundsValue}
      />
    </div>
    <div class="image-container">
      {#if imageUrl}
        <img src={imageUrl} alt="Generated art from prompt" />
      {:else}
        <div class="image-placeholder"></div>
      {/if}
      <progress value={progressData.value} max={progressData.max}></progress>
    </div>
  </div>

  <div class="options-container">
    <label>
      <input type="checkbox" bind:checked={promptsData.useUpscale} />
      Upscale Image
    </label>
    <label>
      <input type="checkbox" bind:checked={promptsData.useFaceDetailer} />
      Apply Face Detailer
    </label>
    {#if availableCheckpoints.length > 0}
      <div class="select-container">
        <label for="checkpoint-select">Checkpoint:</label>
        <select id="checkpoint-select" bind:value={promptsData.selectedCheckpoint}>
          {#each availableCheckpoints as checkpoint (checkpoint)}
            <option value={checkpoint}>{checkpoint}</option>
          {/each}
        </select>
      </div>
    {/if}
    <button onclick={handleSubmit} disabled={isLoading}>
      {isLoading ? 'Generating...' : 'Generate'}
    </button>
    <button class="nav-button" onclick={goToPreviousImage} aria-label="Previous image">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        ><path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18 15h-6v4l-7-7l7-7v4h6z"
        /></svg
      >
    </button>
    <button class="nav-button" onclick={goToNextImage} aria-label="Next image">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        ><path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 9h6V5l7 7l-7 7v-4H6z"
        /></svg
      >
    </button>
    <button class="nav-button" onclick={openSettingsDialog} aria-label="Settings"
      ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m21.32 9.55l-1.89-.63l.89-1.78A1 1 0 0 0 20.13 6L18 3.87a1 1 0 0 0-1.15-.19l-1.78.89l-.63-1.89A1 1 0 0 0 13.5 2h-3a1 1 0 0 0-.95.68l-.63 1.89l-1.78-.89A1 1 0 0 0 6 3.87L3.87 6a1 1 0 0 0-.19 1.15l.89 1.78l-1.89.63a1 1 0 0 0-.68.94v3a1 1 0 0 0 .68.95l1.89.63l-.89 1.78A1 1 0 0 0 3.87 18L6 20.13a1 1 0 0 0 1.15.19l1.78-.89l.63 1.89a1 1 0 0 0 .95.68h3a1 1 0 0 0 .95-.68l.63-1.89l1.78.89a1 1 0 0 0 1.13-.19L20.13 18a1 1 0 0 0 .19-1.15l-.89-1.78l1.89-.63a1 1 0 0 0 .68-.94v-3a1 1 0 0 0-.68-.95M20 12.78l-1.2.4A2 2 0 0 0 17.64 16l.57 1.14l-1.1 1.1l-1.11-.6a2 2 0 0 0-2.79 1.16l-.4 1.2h-1.59l-.4-1.2A2 2 0 0 0 8 17.64l-1.14.57l-1.1-1.1l.6-1.11a2 2 0 0 0-1.16-2.82l-1.2-.4v-1.56l1.2-.4A2 2 0 0 0 6.36 8l-.57-1.11l1.1-1.1L8 6.36a2 2 0 0 0 2.82-1.16l.4-1.2h1.56l.4 1.2A2 2 0 0 0 16 6.36l1.14-.57l1.1 1.1l-.6 1.11a2 2 0 0 0 1.16 2.79l1.2.4ZM12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"
        /></svg
      >
    </button>
  </div>
</div>

<SettingsDialog
  show={showSettingsDialog}
  {settings}
  onClose={closeSettingsDialog}
  onSave={saveSettings}
/>

<style>
  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button:hover {
    background-color: #0056b3;
  }

  .image-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    flex-shrink: 0;
  }

  .content-container {
    display: flex;
    flex-direction: column;
  }

  .content-wrapper {
    display: flex;
    flex-direction: row;
    gap: 20px;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: flex-start; /* Align items to the top */
    padding: 20px;
    flex-grow: 1;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .image-container img {
    max-width: 100%;
    max-height: calc(100vh - 66px - 20px - 20px - 5px);
    border-radius: 4px;
    display: block;
  }

  .nav-button {
    background-color: #f8f9fa;
    color: #8e8e8e;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease;
    padding: 0; /* Remove padding to ensure consistent sizing */
    box-sizing: border-box; /* Ensure consistent box model */
  }

  .nav-button:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #bbb;
  }

  .nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .image-placeholder {
    width: 832px;
    height: 1216px;
    max-width: 100%;
    max-height: calc(100vh - 66px - 20px - 20px - 5px);
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }

  .image-container progress {
    width: 100%;
    height: 5px;
    display: block;
    background-color: white; /* Background of the track */
  }

  /* For WebKit/Blink browsers (Chrome, Safari, Edge, Opera) */
  .image-container progress::-webkit-progress-bar {
    background-color: white;
    border-radius: 3px;
  }

  .image-container progress::-webkit-progress-value {
    background-color: gray;
    border-radius: 3px;
  }

  /* For Firefox */
  .image-container progress::-moz-progress-bar {
    background-color: gray;
    border-radius: 3px;
  }

  .options-container {
    display: flex;
    gap: 20px;
    padding: 15px 20px;
    background-color: white;
    border-top: 1px solid #ddd;
    justify-content: center;
    align-items: center;
    height: 66px; /* Ensure consistent height */
    flex-grow: 0;
  }

  .select-container {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .select-container label {
    white-space: nowrap; /* Prevent label text from wrapping */
  }

  .select-container select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background-color: #fff;
    font-size: 14px;
    min-width: 200px; /* Adjust as needed */
  }

  .options-container label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
</style>
