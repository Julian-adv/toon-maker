export async function fetchCheckpoints(): Promise<string[]> {
  try {
    const response = await fetch('http://127.0.0.1:8188/object_info/CheckpointLoaderSimple')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (
      data &&
      data.CheckpointLoaderSimple &&
      data.CheckpointLoaderSimple.input &&
      data.CheckpointLoaderSimple.input.required &&
      data.CheckpointLoaderSimple.input.required.ckpt_name
    ) {
      const checkpoints = data.CheckpointLoaderSimple.input.required.ckpt_name[0]
      console.log('Available checkpoints:', checkpoints)
      return checkpoints
    } else {
      console.error('Could not find checkpoints in API response:', data)
      return []
    }
  } catch (error) {
    console.error('Error fetching checkpoints:', error)
    return []
  }
}

export interface WebSocketCallbacks {
  onLoadingChange: (loading: boolean) => void
  onProgressUpdate: (progress: { value: number; max: number }) => void
  onImageReceived: (imageBlob: Blob) => void
  onError: (error: string) => void
}

export function connectWebSocket(
  promptId: string,
  generatedClientId: string,
  currentPromptId: string | null,
  finalSaveNodeId: string,
  callbacks: WebSocketCallbacks
): void {
  const ws = new WebSocket(`ws://127.0.0.1:8188/ws?clientId=${generatedClientId}`)
  ws.binaryType = 'arraybuffer'
  
  let lastExecutingNode: string | null = null

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
          lastExecutingNode = data.node
          console.log('Node executing:', data.node)
          if (data.node === null) {
            // Execution is done for this prompt
            console.log('Execution finished for prompt:', promptId)
            callbacks.onLoadingChange(false)
            ws.close()
          }
        }
      } else if (message.type === 'executed') {
        // Potentially useful for knowing when a specific node finished
        // if (message.data.node === SAVE_IMAGE_WEBSOCKET_NODE_ID && message.data.prompt_id === promptId) {
        //  // This means the SaveImageWebsocket node has finished sending its data.
        // }
      } else if (message.type === 'progress') {
        // Handle progress updates
        callbacks.onProgressUpdate({
          value: message.data.value,
          max: message.data.max
        })
      }
    } else if (event.data instanceof ArrayBuffer) {
      // Check if the last executing node was our SaveImageWebsocket node
      // AND that the current prompt ID matches.
      console.log('Received ArrayBuffer, lastExecutingNode:', lastExecutingNode, 'finalSaveNodeId:', finalSaveNodeId, 'promptId:', promptId)
      if (
        lastExecutingNode === finalSaveNodeId &&
        promptId /* && execution prompt_id matches */
      ) {
        console.log('Creating image blob from ArrayBuffer, size:', event.data.byteLength)
        const imageBlob = new Blob([event.data.slice(8)], { type: 'image/png' })
        callbacks.onImageReceived(imageBlob)
        callbacks.onLoadingChange(false)
        ws.close()
        lastExecutingNode = null
      } else {
        console.log('ArrayBuffer received but conditions not met')
      }
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    callbacks.onLoadingChange(false)
  }

  ws.onclose = () => {
    console.log('WebSocket connection closed')
  }
}