<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import TextAreaInput from './TextAreaInput.svelte'
  import { savePrompts, saveImage, loadPrompts } from './utils/fileIO'
  import type { PromptsData } from './utils/fileIO'
  import { fetchCheckpoints, connectWebSocket, type WebSocketCallbacks } from './utils/comfyui'

  let isLoading: boolean = $state(false)
  let imageUrl: string | null = $state(null)
  let currentPromptId: string | null = $state(null)
  let clientId: string = ''
  let progressData: { value: number; max: number } = $state({ value: 0, max: 100 })
  let availableCheckpoints: string[] = $state([])

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

  const FINAL_SAVE_NODE_ID = 'final_save_output' // Consistent ID for our dynamically added save node

  // Default ComfyUI workflow prompt - updated to use SaveImageWebsocket
  const defaultWorkflowPrompt = {
    '5': {
      inputs: {
        guide_size: 512,
        guide_size_for: true,
        max_size: 1024,
        seed: 836267740683999,
        steps: 20,
        cfg: 8,
        sampler_name: 'euler_ancestral',
        scheduler: 'simple',
        denoise: 0.5,
        feather: 5,
        noise_mask: true,
        force_inpaint: true,
        bbox_threshold: 0.5,
        bbox_dilation: 10,
        bbox_crop_factor: 3,
        sam_detection_hint: 'center-1',
        sam_dilation: 0,
        sam_threshold: 0.93,
        sam_bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: 'False',
        drop_size: 10,
        wildcard: '',
        cycle: 1,
        inpaint_model: false,
        noise_mask_feather: 20,
        tiled_encode: false,
        tiled_decode: false,
        image: ['18', 0],
        model: ['10', 0],
        clip: ['10', 1],
        vae: ['10', 2],
        positive: ['11', 0],
        negative: ['12', 0],
        bbox_detector: ['20', 0],
        sam_model_opt: ['6', 0]
      },
      class_type: 'FaceDetailer',
      _meta: {
        title: 'FaceDetailer1'
      }
    },
    '6': {
      inputs: {
        model_name: 'sam_vit_b_01ec64.pth',
        device_mode: 'AUTO'
      },
      class_type: 'SAMLoader',
      _meta: {
        title: 'SAMLoader (Impact)'
      }
    },
    '8': {
      inputs: {
        seed: 764212958336468,
        steps: 28,
        cfg: 5,
        sampler_name: 'euler_ancestral',
        scheduler: 'simple',
        denoise: 1,
        model: ['10', 0],
        positive: ['11', 0],
        negative: ['12', 0],
        latent_image: ['9', 0]
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler'
      }
    },
    '9': {
      inputs: {
        width: 832,
        height: 1216,
        batch_size: 1
      },
      class_type: 'EmptyLatentImage',
      _meta: {
        title: 'Empty Latent Image'
      }
    },
    '10': {
      inputs: {
        ckpt_name: 'kakarot28D2025_v2025Semireal.safetensors'
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint'
      }
    },
    '11': {
      inputs: {
        text: 'maid,christian louboutin high heels',
        clip: ['10', 1]
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode (Prompt)'
      }
    },
    '12': {
      inputs: {
        text: '',
        clip: ['10', 1]
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode (Prompt)'
      }
    },
    '14': {
      inputs: {
        upscale_method: 'nearest-exact',
        scale_by: 2.0000000000000004,
        samples: ['8', 0]
      },
      class_type: 'LatentUpscaleBy',
      _meta: {
        title: 'Upscale Latent By'
      }
    },
    '15': {
      inputs: {
        samples: ['17', 0],
        vae: ['10', 2]
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode'
      }
    },
    '17': {
      inputs: {
        seed: 265369671560568,
        steps: 28,
        cfg: 5,
        sampler_name: 'euler_ancestral',
        scheduler: 'simple',
        denoise: 0.4000000000000001,
        model: ['10', 0],
        positive: ['11', 0],
        negative: ['12', 0],
        latent_image: ['14', 0]
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler'
      }
    },
    '18': {
      inputs: {
        samples: ['8', 0],
        vae: ['10', 2]
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode'
      }
    },
    '20': {
      inputs: {
        model_name: 'bbox/face_yolov8m.pt'
      },
      class_type: 'UltralyticsDetectorProvider',
      _meta: {
        title: 'UltralyticsDetectorProvider'
      }
    },
    '22': {
      inputs: {
        guide_size: 512,
        guide_size_for: true,
        max_size: 1024,
        seed: 781342677367830,
        steps: 20,
        cfg: 8,
        sampler_name: 'euler_ancestral',
        scheduler: 'simple',
        denoise: 0.5,
        feather: 5,
        noise_mask: true,
        force_inpaint: true,
        bbox_threshold: 0.5,
        bbox_dilation: 10,
        bbox_crop_factor: 3,
        sam_detection_hint: 'center-1',
        sam_dilation: 0,
        sam_threshold: 0.93,
        sam_bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: 'False',
        drop_size: 10,
        wildcard: '',
        cycle: 1,
        inpaint_model: false,
        noise_mask_feather: 20,
        tiled_encode: false,
        tiled_decode: false,
        image: ['15', 0],
        model: ['10', 0],
        clip: ['10', 1],
        vae: ['10', 2],
        positive: ['11', 0],
        negative: ['12', 0],
        bbox_detector: ['20', 0],
        sam_model_opt: ['6', 0]
      },
      class_type: 'FaceDetailer',
      _meta: {
        title: 'FaceDetailer2'
      }
    }
  }


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
            onLoadingChange: (loading) => { isLoading = loading },
            onProgressUpdate: (progress) => { progressData = progress },
            onImageReceived: (imageBlob) => {
              if (imageUrl) {
                URL.revokeObjectURL(imageUrl)
              }
              imageUrl = URL.createObjectURL(imageBlob)
              saveImage(imageBlob)
            }
          }
          
          connectWebSocket(responseData.prompt_id, clientId, currentPromptId, FINAL_SAVE_NODE_ID, callbacks)
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
  onDestroy(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  })

</script>

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

<div class="prompt-container">
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
  </div>
</div>

<style>
  .prompt-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 1000px;
    width: 100%;
  }

  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    align-self: flex-end; /* Align button to the right */
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

  .content-wrapper {
    display: flex;
    flex-direction: row;
    gap: 20px;
    width: 100%;
    justify-content: center;
    align-items: flex-start; /* Align items to the top */
    padding: 20px;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .image-container img {
    max-width: 100%;
    max-height: 1200px;
    border-radius: 4px;
    display: block;
  }

  .image-placeholder {
    width: 832px;
    height: 1216px;
    max-width: 100%;
    max-height: 1200px;
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
    max-width: 1000px;
    width: 100%;
    justify-content: center; /* Center checkboxes */
    align-items: center;
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
