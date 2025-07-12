<script lang="ts">
  interface Settings {
    imageWidth: number
    imageHeight: number
    cfgScale: number
    steps: number
    seed: number
    sampler: string
  }

  interface Props {
    show: boolean
    settings: Settings
    onClose: () => void
    onSave: (settings: Settings) => void
  }

  let { show, settings, onClose, onSave }: Props = $props()

  // Local copy of settings for editing
  let localSettings: Settings = $state({
    imageWidth: settings.imageWidth,
    imageHeight: settings.imageHeight,
    cfgScale: settings.cfgScale,
    steps: settings.steps,
    seed: settings.seed,
    sampler: settings.sampler
  })

  // Update local settings when props change
  $effect(() => {
    if (show) {
      localSettings = {
        imageWidth: settings.imageWidth,
        imageHeight: settings.imageHeight,
        cfgScale: settings.cfgScale,
        steps: settings.steps,
        seed: settings.seed,
        sampler: settings.sampler
      }
    }
  })

  function handleSave() {
    onSave(localSettings)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-overlay" onclick={onClose} onkeydown={handleKeydown}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="dialog-content" onclick={(e) => e.stopPropagation()}>
      <div class="dialog-header">
        <h3>Settings</h3>
        <button class="close-button" onclick={onClose}>×</button>
      </div>

      <div class="dialog-body">
        <div class="setting-group">
          <label for="image-width">Image Width:</label>
          <input
            id="image-width"
            type="number"
            bind:value={localSettings.imageWidth}
            min="256"
            max="2048"
            step="64"
          />
        </div>

        <div class="setting-group">
          <label for="image-height">Image Height:</label>
          <input
            id="image-height"
            type="number"
            bind:value={localSettings.imageHeight}
            min="256"
            max="2048"
            step="64"
          />
        </div>

        <div class="setting-group">
          <label for="cfg-scale">CFG Scale:</label>
          <input
            id="cfg-scale"
            type="number"
            bind:value={localSettings.cfgScale}
            min="1"
            max="20"
            step="0.5"
          />
        </div>

        <div class="setting-group">
          <label for="steps">Steps:</label>
          <input
            id="steps"
            type="number"
            bind:value={localSettings.steps}
            min="1"
            max="100"
            step="1"
          />
        </div>

        <div class="setting-group">
          <label for="seed">Seed (-1 for random):</label>
          <input
            id="seed"
            type="number"
            bind:value={localSettings.seed}
            min="-1"
            max="999999999"
            step="1"
          />
        </div>

        <div class="setting-group">
          <label for="sampler">Sampler:</label>
          <select id="sampler" bind:value={localSettings.sampler}>
            <option value="euler_ancestral">Euler Ancestral</option>
            <option value="euler">Euler</option>
            <option value="dpmpp_2m">DPM++ 2M</option>
            <option value="dpmpp_sde">DPM++ SDE</option>
            <option value="ddim">DDIM</option>
          </select>
        </div>
      </div>

      <div class="dialog-footer">
        <button onclick={onClose} class="secondary-button">Cancel</button>
        <button onclick={handleSave} class="primary-button">Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .dialog-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 10px 20px;
    border-bottom: 1px solid #eee;
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background-color: #f5f5f5;
    border-radius: 50%;
  }

  .dialog-body {
    padding: 20px;
    max-height: 50vh;
    overflow-y: auto;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 15px;
  }

  .setting-group label {
    font-weight: 500;
    color: #333;
    font-size: 14px;
  }

  .setting-group input,
  .setting-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .setting-group input:focus,
  .setting-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .dialog-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 15px 20px 20px 20px;
    border-top: 1px solid #eee;
  }

  .primary-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .primary-button:hover {
    background-color: #0056b3;
  }

  .secondary-button {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .secondary-button:hover {
    background-color: #545b62;
  }
</style>
