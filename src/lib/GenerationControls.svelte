<!-- Component for generation controls, progress bar, and loading state -->
<script lang="ts">
  import SettingsDialog from './SettingsDialog.svelte'
  import type { Settings } from '$lib/types'

  interface Props {
    isLoading: boolean
    progressData: { value: number; max: number }
    settings: Settings
    onGenerate: () => void
    onSettingsChange: (settings: Settings) => void
  }

  let {
    isLoading,
    progressData,
    settings,
    onGenerate,
    onSettingsChange
  }: Props = $props()

  let showSettingsDialog = $state(false)

  function openSettingsDialog() {
    showSettingsDialog = true
  }

  function closeSettingsDialog() {
    showSettingsDialog = false
  }

  function handleSettingsChange(newSettings: Settings) {
    onSettingsChange(newSettings)
    showSettingsDialog = false
  }
</script>

<div class="generation-controls">
  <div class="controls-row">
    <button 
      class="generate-btn" 
      onclick={onGenerate}
      disabled={isLoading}
    >
      {isLoading ? 'Generating...' : 'Generate Image'}
    </button>

    <button 
      class="settings-btn" 
      onclick={openSettingsDialog}
      disabled={isLoading}
      aria-label="Settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="m21.32 9.55l-1.89-.63l.89-1.78A1 1 0 0 0 20.13 6L18 3.87a1 1 0 0 0-1.15-.19l-1.78.89l-.63-1.89A1 1 0 0 0 13.5 2h-3a1 1 0 0 0-.95.68l-.63 1.89l-1.78-.89A1 1 0 0 0 6 3.87L3.87 6a1 1 0 0 0-.19 1.15l.89 1.78l-1.89.63a1 1 0 0 0-.68.94v3a1 1 0 0 0 .68.95l1.89.63l-.89 1.78A1 1 0 0 0 3.87 18L6 20.13a1 1 0 0 0 1.15.19l1.78-.89l.63 1.89a1 1 0 0 0 .95.68h3a1 1 0 0 0 .95-.68l.63-1.89l1.78.89a1 1 0 0 0 1.13-.19L20.13 18a1 1 0 0 0 .19-1.15l-.89-1.78l1.89-.63a1 1 0 0 0 .68-.94v-3a1 1 0 0 0-.68-.95M20 12.78l-1.2.4A2 2 0 0 0 17.64 16l.57 1.14l-1.1 1.1l-1.11-.6a2 2 0 0 0-2.79 1.16l-.4 1.2h-1.59l-.4-1.2A2 2 0 0 0 8 17.64l-1.14.57l-1.1-1.1l.6-1.11a2 2 0 0 0-1.16-2.82l-1.2-.4v-1.56l1.2-.4A2 2 0 0 0 6.36 8l-.57-1.11l1.1-1.1L8 6.36a2 2 0 0 0 2.82-1.16l.4-1.2h1.56l.4 1.2A2 2 0 0 0 16 6.36l1.14-.57l1.1 1.1l-.6 1.11a2 2 0 0 0 1.16 2.79l1.2.4ZM12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"
        />
      </svg>
    </button>
  </div>

  {#if isLoading}
    <div class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          style="width: {(progressData.value / progressData.max) * 100}%"
        ></div>
      </div>
      <span class="progress-text">
        {Math.round((progressData.value / progressData.max) * 100)}%
      </span>
    </div>
  {/if}
</div>

<SettingsDialog 
  show={showSettingsDialog} 
  {settings}
  onClose={closeSettingsDialog}
  onSave={handleSettingsChange}
/>

<style>
  .generation-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    margin-top: 1rem;
  }

  .controls-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }

  .generate-btn {
    padding: 0.75rem 1.5rem;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 160px;
  }

  .generate-btn:hover:not(:disabled) {
    background: #1976D2;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .generate-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .generate-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: #f5f5f5;
    color: #999;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 48px;
    height: 48px;
  }

  .settings-btn:hover:not(:disabled) {
    background: #e9e9e9;
    border-color: #bbb;
  }

  .settings-btn:disabled {
    background: #f9f9f9;
    color: #999;
    cursor: not-allowed;
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #666;
    min-width: 40px;
    text-align: right;
  }
</style>