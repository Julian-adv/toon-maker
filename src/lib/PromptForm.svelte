<!-- Component for prompt input forms and checkpoint selection -->
<script lang="ts">
  import TextAreaInput from './TextAreaInput.svelte'
  import CategoryManagerDialog from './CategoryManagerDialog.svelte'
  import {
    promptsData,
    updateCategoryValue,
    updateCategoryValues,
    updateCheckpoint,
    updateUpscale,
    updateFaceDetailer,
    addCategory,
    removeCategory
  } from './stores/promptsStore'
  import type { PromptCategory, OptionItem } from '$lib/types'
  import { Trash } from 'svelte-heros-v2'

  interface Props {
    availableCheckpoints: string[]
  }

  let { availableCheckpoints }: Props = $props()

  // Dynamic category update functions
  function handleCategoryValueChange(categoryId: string) {
    return (value: OptionItem) => {
      updateCategoryValue(categoryId, value)
    }
  }

  function handleCategoryOptionsChange(categoryId: string) {
    return (options: OptionItem[]) => {
      updateCategoryValues(categoryId, options)
    }
  }

  // Category management
  let showCategoryManager = $state(false)

  function handleAddCategory(newCategory: PromptCategory) {
    addCategory(newCategory)
  }

  function handleRemoveCategory(categoryId: string) {
    if (confirm('Are you sure you want to remove this category?')) {
      removeCategory(categoryId)
    }
  }
</script>

<div class="prompt-form">
  <div class="form-section">
    <div class="category-header">
      <h3>Prompt Categories</h3>
      <button
        type="button"
        class="btn-add-category bg-sky-500"
        onclick={() => (showCategoryManager = true)}
      >
        + Add Category
      </button>
    </div>

    {#each $promptsData.categories as category (category.id)}
      <div class="category-item">
        <div class="category-controls">
          <button
            type="button"
            class="btn-remove-category rounded-sm border border-red-200 bg-red-100 p-1 text-red-500 hover:bg-red-200"
            onclick={() => handleRemoveCategory(category.id)}
            title="Remove category"
          >
            <Trash />
          </button>
        </div>
        <TextAreaInput
          id={category.id}
          label={category.name}
          placeholder={`${category.name} description...`}
          bind:value={category.currentValue}
          options={category.values}
          onValueChange={handleCategoryValueChange(category.id)}
          onOptionsChange={handleCategoryOptionsChange(category.id)}
        />
      </div>
    {/each}
  </div>

  <div class="form-section">
    <div class="field">
      <label for="checkpoint">Checkpoint</label>
      <select
        id="checkpoint"
        value={$promptsData.selectedCheckpoint || ''}
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
          checked={$promptsData.useUpscale}
          onchange={(e) => updateUpscale((e.target as HTMLInputElement).checked)}
        />
        Use Upscale
      </label>
    </div>

    <div class="field">
      <label class="checkbox-label">
        <input
          type="checkbox"
          class="accent-sky-600"
          checked={$promptsData.useFaceDetailer}
          onchange={(e) => updateFaceDetailer((e.target as HTMLInputElement).checked)}
        />
        Use Face Detailer
      </label>
    </div>
  </div>
</div>

<CategoryManagerDialog
  show={showCategoryManager}
  onClose={() => (showCategoryManager = false)}
  onAddCategory={handleAddCategory}
/>

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

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .category-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .btn-add-category {
    padding: 0.5rem 1rem;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s ease;
  }

  .btn-add-category:hover {
    background: #1976d2;
  }

  .category-item {
    position: relative;
    margin-bottom: 1rem;
  }

  .category-controls {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }

  .btn-remove-category {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: background 0.2s ease;
  }
</style>
