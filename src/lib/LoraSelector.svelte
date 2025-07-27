<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    selectedLoras: string[]
    onLoraChange: (loras: string[]) => void
  }

  let { selectedLoras = $bindable([]), onLoraChange }: Props = $props()

  let availableLoras: string[] = $state([])
  let loading = $state(true)
  let error = $state('')

  async function fetchLoras() {
    try {
      loading = true
      const response = await fetch('/api/loras')
      const data = await response.json()

      if (response.ok) {
        availableLoras = data.loras || []
        error = ''
      } else {
        error = data.error || 'Failed to fetch LoRA models'
        availableLoras = []
      }
    } catch (err) {
      error = 'Failed to connect to ComfyUI'
      availableLoras = []
      console.error('Error fetching LoRAs:', err)
    } finally {
      loading = false
    }
  }

  function handleLoraToggle(lora: string, checked: boolean) {
    let newSelectedLoras: string[]

    if (checked) {
      newSelectedLoras = [...selectedLoras, lora]
    } else {
      newSelectedLoras = selectedLoras.filter((l) => l !== lora)
    }

    selectedLoras = newSelectedLoras
    onLoraChange(newSelectedLoras)
  }

  onMount(() => {
    fetchLoras()
  })
</script>

<div class="lora-selector">
  <h3 class="mb-2 pt-1 text-left text-sm font-bold text-gray-700">LoRA Models</h3>

  {#if loading}
    <div class="text-sm text-gray-500">Loading LoRA models...</div>
  {:else if error}
    <div class="text-sm text-red-600">{error}</div>
    <button onclick={fetchLoras} class="mt-1 text-xs text-blue-600 hover:text-blue-800">
      Retry
    </button>
  {:else if availableLoras.length === 0}
    <div class="text-sm text-gray-500">No LoRA models found</div>
  {:else}
    <div class="lora-list max-h-32 space-y-1 overflow-y-auto">
      {#each availableLoras as lora (lora)}
        <label class="flex items-center space-x-2 text-xs">
          <input
            type="checkbox"
            checked={selectedLoras.includes(lora)}
            onchange={(e) => handleLoraToggle(lora, (e.target as HTMLInputElement).checked)}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="truncate" title={lora}>{lora}</span>
        </label>
      {/each}
    </div>
  {/if}

  {#if selectedLoras.length > 0}
    <div class="mt-2 text-xs text-gray-600">
      Selected: {selectedLoras.length} LoRA{selectedLoras.length > 1 ? 's' : ''}
    </div>
  {/if}
</div>

<style>
  .lora-list {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  .lora-list::-webkit-scrollbar {
    width: 6px;
  }

  .lora-list::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 3px;
  }

  .lora-list::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }

  .lora-list::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
</style>
