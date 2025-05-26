<script lang="ts">
  import { onDestroy } from 'svelte'

  let promptValue: string = $state('')
  let isLoading: boolean = $state(false)
  let imageUrl: string | null = $state(null)
  let currentPromptId: string | null = $state(null)
  let ws: WebSocket | null = $state(null)
  let clientId: string = ''
  let lastExecutingNode: string | null = $state(null) // To track the node that produces the image

  const SAVE_IMAGE_WEBSOCKET_NODE_ID = 'save_image_ws' // Arbitrary ID for our websocket node

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
    },
    [SAVE_IMAGE_WEBSOCKET_NODE_ID]: {
      inputs: {
        images: ['22', 0]
      },
      class_type: 'SaveImageWebsocket',
      _meta: {
        title: 'SaveImageWebsocket4'
      }
    },
    '25': {
      inputs: {
        images: ['15', 0]
      },
      class_type: 'SaveImageWebsocket',
      _meta: {
        title: 'SaveImageWebsocket3'
      }
    },
    '26': {
      inputs: {
        images: ['5', 0]
      },
      class_type: 'SaveImageWebsocket',
      _meta: {
        title: 'SaveImageWebsocket2'
      }
    },
    '27': {
      inputs: {
        images: ['18', 0]
      },
      class_type: 'SaveImageWebsocket',
      _meta: {
        title: 'SaveImageWebsocket1'
      }
    }
  }

  function connectWebSocket(promptId: string, generatedClientId: string) {
    if (ws) {
      ws.close()
    }
    ws = new WebSocket(`ws://127.0.0.1:8188/ws?clientId=${generatedClientId}`)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      console.log('WebSocket connection established')
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data)
        console.log('WS Message:', message)
        if (message.type === 'executing') {
          const data = message.data
          if (data.prompt_id === promptId) {
            lastExecutingNode = data.node // Store the current node being executed
            if (data.node === null) {
              // Execution is done for this prompt
              console.log('Execution finished for prompt:', promptId)
              isLoading = false
              if (ws) ws.close()
            }
          }
        } else if (message.type === 'executed') {
          // Potentially useful for knowing when a specific node finished
          // if (message.data.node === SAVE_IMAGE_WEBSOCKET_NODE_ID && message.data.prompt_id === promptId) {
          //  // This means the SaveImageWebsocket node has finished sending its data.
          // }
        } else if (message.type === 'progress') {
          // Handle progress updates if needed
          // console.log('Progress:', message.data.value, '/', message.data.max);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Check if the last executing node was our SaveImageWebsocket node
        // AND that the current prompt ID matches.
        // Note: The 'executing' message for SaveImageWebsocket might arrive *before* the binary data.
        if (lastExecutingNode === SAVE_IMAGE_WEBSOCKET_NODE_ID && currentPromptId === promptId) {
          console.log('Binary image data received')
          // The Python example slices [8:], this is for a specific header ComfyUI adds for some WS images.
          // Let's assume it's direct image data for now, or adjust if it's wrapped.
          // For direct binary image data from SaveImageWebsocket, it might not have the 8-byte prefix.
          // If images are broken, this is the first place to check.
          const imageBlob = new Blob([event.data.slice(8)], { type: 'image/png' }) // Assuming PNG, adjust if type is different or known. Sliced 8-byte header.
          if (imageUrl) URL.revokeObjectURL(imageUrl) // Revoke old URL to free memory
          imageUrl = URL.createObjectURL(imageBlob)
          console.log('Image URL created:', imageUrl)
          isLoading = false // Image received, stop loading
          if (ws) ws.close() // Close WebSocket after receiving the image
          lastExecutingNode = null // Reset for next run
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isLoading = false
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      // isLoading = false; // Might already be set by success or error
      ws = null
    }
  }

  async function handleSubmit() {
    if (!promptValue.trim()) {
      console.log('Prompt is empty')
      return
    }
    isLoading = true
    // imageUrl = null // Clear previous image
    lastExecutingNode = null
    clientId = crypto.randomUUID() // Generate a new client ID for this session

    console.log('Submitting prompt:', promptValue, 'Client ID:', clientId)

    const workflow = JSON.parse(JSON.stringify(defaultWorkflowPrompt))
    workflow['11'].inputs.text = promptValue
    workflow['8'].inputs.seed = Math.floor(Math.random() * 10000000000)

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
          connectWebSocket(responseData.prompt_id, clientId)
          // isLoading remains true until WebSocket gives image or error
        } else {
          console.error('Prompt ID not found in response:', responseData)
          isLoading = false
        }
        // promptValue = ''; // Clear input after successful queueing, or wait for image?
      }
    } catch (error) {
      console.error('Failed to send prompt to ComfyUI:', error)
      isLoading = false
    }
    // isLoading is managed by WebSocket flow now
  }

  // Cleanup WebSocket on component destroy
  onDestroy(() => {
    if (ws) {
      console.log('Closing WebSocket on component destroy')
      ws.close()
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  })
</script>

<div class="prompt-container">
  <textarea
    bind:value={promptValue}
    placeholder="Enter your prompt..."
    rows="3"
    class="focus:outline-blue-500"
  ></textarea>
  <button onclick={handleSubmit} disabled={isLoading}>
    {isLoading ? 'Generating...' : 'Generate'}
  </button>
</div>

{#if imageUrl}
  <div class="image-container">
    <img src={imageUrl} alt={`Generated image for prompt: ${promptValue || 'current prompt'}`} />
  </div>
{/if}

<style>
  .prompt-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 1000px;
    width: 100%;
    margin: 20px auto;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 16px;
    resize: vertical; /* Allow vertical resizing, disable horizontal */
    box-sizing: border-box; /* Ensure padding and border are included in the element's total width and height */
    background-color: #fff;
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
    margin-top: 20px;
    text-align: center;
  }

  .image-container img {
    max-width: 100%;
    max-height: 1000px; /* Or whatever max height you prefer */
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
