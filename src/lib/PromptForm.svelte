<!-- Component for prompt input forms and checkpoint selection -->
<script lang="ts">
  import TextAreaInput from './TextAreaInput.svelte'
  import type { PromptsData } from '$lib/types'

  interface Props {
    promptsData: PromptsData
    availableCheckpoints: string[]
    onPromptsChange: (data: PromptsData) => void
  }

  let { promptsData, availableCheckpoints, onPromptsChange }: Props = $props()

  // Update functions for form inputs

  function updateQualityValue(value: string) {
    const updated = { ...promptsData }
    updated.qualityValue = value
    onPromptsChange(updated)
  }

  function updateCharacterValue(value: string) {
    const updated = { ...promptsData }
    updated.characterValue = value
    onPromptsChange(updated)
  }

  function updateOutfitValue(value: string) {
    const updated = { ...promptsData }
    updated.outfitValue = value
    onPromptsChange(updated)
  }

  function updatePoseValue(value: string) {
    const updated = { ...promptsData }
    updated.poseValue = value
    onPromptsChange(updated)
  }

  function updateBackgroundsValue(value: string) {
    const updated = { ...promptsData }
    updated.backgroundsValue = value
    onPromptsChange(updated)
  }

  function updateCheckpoint(checkpoint: string) {
    const updated = { ...promptsData }
    updated.selectedCheckpoint = checkpoint
    onPromptsChange(updated)
  }

  function updateUpscale(enabled: boolean) {
    const updated = { ...promptsData }
    updated.useUpscale = enabled
    onPromptsChange(updated)
  }

  function updateFaceDetailer(enabled: boolean) {
    const updated = { ...promptsData }
    updated.useFaceDetailer = enabled
    onPromptsChange(updated)
  }
</script>

<div class="prompt-form">
  <div class="form-section">
    <TextAreaInput
      id="quality"
      label="Quality"
      placeholder="Quality settings..."
      value={promptsData.qualityValue}
      options={promptsData.qualityValues}
      rows={3}
      selectedValue={promptsData.qualityValue}
      onValueChange={updateQualityValue}
    />

    <TextAreaInput
      id="character"
      label="Character"
      placeholder="Character description..."
      value={promptsData.characterValue}
      options={promptsData.characterValues}
      rows={3}
      selectedValue={promptsData.characterValue}
      onValueChange={updateCharacterValue}
    />

    <TextAreaInput
      id="outfit"
      label="Outfit"
      placeholder="Outfit description..."
      value={promptsData.outfitValue}
      options={promptsData.outfitValues}
      rows={3}
      selectedValue={promptsData.outfitValue}
      onValueChange={updateOutfitValue}
    />

    <TextAreaInput
      id="pose"
      label="Pose"
      placeholder="Pose description..."
      value={promptsData.poseValue}
      options={promptsData.poseValues}
      rows={3}
      selectedValue={promptsData.poseValue}
      onValueChange={updatePoseValue}
    />

    <TextAreaInput
      id="backgrounds"
      label="Backgrounds"
      placeholder="Background description..."
      value={promptsData.backgroundsValue}
      options={promptsData.backgroundsValues}
      rows={3}
      selectedValue={promptsData.backgroundsValue}
      onValueChange={updateBackgroundsValue}
    />
  </div>

  <div class="form-section">
    <div class="field">
      <label for="checkpoint">Checkpoint</label>
      <select
        id="checkpoint"
        value={promptsData.selectedCheckpoint || ''}
        onchange={(e) => updateCheckpoint((e.target as HTMLSelectElement).value)}
      >
        <option value="">Select checkpoint...</option>
        {#each availableCheckpoints as checkpoint (checkpoint)}
          <option value={checkpoint}>{checkpoint}</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={promptsData.useUpscale}
          onchange={(e) => updateUpscale((e.target as HTMLInputElement).checked)}
        />
        Use Upscale
      </label>
    </div>

    <div class="field">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={promptsData.useFaceDetailer}
          onchange={(e) => updateFaceDetailer((e.target as HTMLInputElement).checked)}
        />
        Use Face Detailer
      </label>
    </div>
  </div>
</div>

<style>
  .prompt-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field label {
    font-weight: bold;
    font-size: 16px;
    color: #000;
    text-align: left;
  }

  .field select {
    width: 100%;
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    background-color: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .field select:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  .field .checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: normal;
    font-size: 14px;
  }

  .checkbox-label input[type='checkbox'] {
    margin: 0;
    cursor: pointer;
  }
</style>
