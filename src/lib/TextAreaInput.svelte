<script lang="ts">
  import type { OptionItem, PromptCategory } from './types'
  import OptionsEditDialog from './OptionsEditDialog.svelte'
  import CategoryEditDialog from './CategoryEditDialog.svelte'
  import ComboBox from './ComboBox.svelte'
  import AutoCompleteTextarea from './AutoCompleteTextarea.svelte'

  interface Props {
    id: string
    label: string
    value: OptionItem
    placeholder: string
    options: OptionItem[]
    onValueChange: (value: OptionItem) => void
    onOptionsChange: (options: OptionItem[]) => void
    resolvedRandomValue?: OptionItem
    onDragStart?: (event: DragEvent) => void
    onCategoryUpdate: (updatedCategory: PromptCategory) => void
    onCategoryDelete: (categoryId: string) => void
  }

  let {
    id,
    label,
    value = $bindable(),
    placeholder,
    options,
    onValueChange,
    onOptionsChange,
    resolvedRandomValue,
    onDragStart,
    onCategoryUpdate,
    onCategoryDelete
  }: Props = $props()

  let showEditDialog = $state(false)
  let showCategoryEditDialog = $state(false)
  let textareaValue = $state(value.value)

  // Add random option to the options array
  let optionsWithRandom = $derived([{ title: '[Random]', value: '[Random]' }, ...options])

  // Sync textareaValue with value.value when value changes
  $effect(() => {
    if (value.title === '[Random]') {
      if (resolvedRandomValue) {
        textareaValue = `[${resolvedRandomValue.title}]\n${resolvedRandomValue.value}`
      } else {
        textareaValue = '[Random - will be selected during generation]'
      }
    } else if (value.value !== textareaValue) {
      textareaValue = value.value
    }
  })

  function handleTextareaValueChange(newValue: string) {
    textareaValue = newValue
    value = { ...value, value: newValue }
    onValueChange(value)
  }

  function openEditDialog() {
    showEditDialog = true
  }

  function openCategoryEditDialog() {
    showCategoryEditDialog = true
  }

  // Get the appropriate value to pass to OptionsEditDialog
  let dialogValue = $derived.by(() => {
    if (value.title === '[Random]' && resolvedRandomValue) {
      return resolvedRandomValue
    }
    return value
  })

  function closeEditDialog() {
    showEditDialog = false
  }

  function closeCategoryEditDialog() {
    showCategoryEditDialog = false
  }

  // Create category object for the CategoryEditDialog
  let currentCategory = $derived({
    id,
    name: label,
    values: options,
    currentValue: value
  })
</script>

<div class="input-group">
  <div
    class="label-container"
    draggable="true"
    ondragstart={onDragStart}
    title="Drag to reorder"
    role="button"
    tabindex="0"
  >
    <div class="label-with-drag">
      <div class="drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
      <label for={id}>{label}</label>
    </div>
    <button
      type="button"
      class="category-edit-button"
      onclick={openCategoryEditDialog}
      title="Edit category name"
      aria-label="Edit category name"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
  <div class="select-container">
    <ComboBox bind:value options={optionsWithRandom} placeholder="Enter title..." {onValueChange} />
    <button
      type="button"
      class="edit-button"
      onclick={openEditDialog}
      title="Edit options"
      aria-label="Edit options"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
  <AutoCompleteTextarea
    {id}
    value={textareaValue}
    {placeholder}
    onValueChange={handleTextareaValueChange}
    readonly={value.title === '[Random]'}
  />

  <OptionsEditDialog
    show={showEditDialog}
    {label}
    {options}
    value={dialogValue}
    onClose={closeEditDialog}
    {onOptionsChange}
    {onValueChange}
  />

  <CategoryEditDialog
    show={showCategoryEditDialog}
    category={currentCategory}
    onClose={closeCategoryEditDialog}
    onCategoryUpdate={onCategoryUpdate}
    onCategoryDelete={onCategoryDelete}
  />
</div>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 5px; /* Spacing between label and textarea */
    width: 100%;
  }

  label {
    font-weight: bold;
    font-size: 16px;
    text-align: left;
  }

  .select-container {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .edit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0px;
    background: #f5f5f5;
    border: none;
    border-radius: 4px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #ddd;
  }

  .edit-button:hover {
    background: #e8e8e8;
  }

  .edit-button:active {
    transform: scale(0.95);
  }

  .label-container {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    cursor: grab;
    padding: 4px;
    margin: -4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .category-edit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 3px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .category-edit-button:hover {
    background: #e9ecef;
    border-color: #ccc;
    color: #495057;
  }

  .category-edit-button:active {
    transform: scale(0.95);
  }

  .label-container:active {
    cursor: grabbing;
  }

  .label-with-drag {
    display: flex;
    align-items: center;
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 24px;
    height: 24px;
    color: #666;
    cursor: grab;
    border-radius: 4px;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }

  .drag-handle:hover {
    background: #f0f0f0;
    color: #333;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

</style>
