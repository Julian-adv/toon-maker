<script lang="ts">
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
    '3': {
      class_type: 'KSampler',
      inputs: {
        cfg: 8,
        denoise: 1,
        latent_image: ['5', 0],
        model: ['4', 0],
        negative: ['7', 0],
        positive: ['6', 0],
        sampler_name: 'euler',
        scheduler: 'normal',
        seed: 8566257,
        steps: 20
      }
    },
    '4': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'kakarot28D2025_v2025Semireal.safetensors' // Make sure this checkpoint exists
      }
    },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: {
        batch_size: 1,
        height: 1024,
        width: 1024
      }
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['4', 1],
        text: 'masterpiece best quality girl' // This will be replaced
      }
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['4', 1],
        text: 'bad hands'
      }
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['3', 0],
        vae: ['4', 2]
      }
    },
    [SAVE_IMAGE_WEBSOCKET_NODE_ID]: {
      // Using the constant as node ID
      class_type: 'SaveImageWebsocket',
      inputs: {
        images: ['8', 0] // Output from VAEDecode
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
          const imageBlob = new Blob([event.data.slice(8)], { type: 'image/png' }); // Assuming PNG, adjust if type is different or known. Sliced 8-byte header.
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
    imageUrl = null // Clear previous image
    lastExecutingNode = null
    clientId = crypto.randomUUID() // Generate a new client ID for this session

    console.log('Submitting prompt:', promptValue, 'Client ID:', clientId)

    const workflow = JSON.parse(JSON.stringify(defaultWorkflowPrompt))
    workflow['6'].inputs.text = promptValue
    // Optionally, randomize seed for KSampler (node '3')
    // workflow['3'].inputs.seed = Math.floor(Math.random() * 10000000000);

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
  $effect.root(() => {
    return () => {
      if (ws) {
        console.log('Closing WebSocket on component destroy')
        ws.close()
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
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
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
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
    max-height: 512px; /* Or whatever max height you prefer */
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
