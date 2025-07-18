<script lang="ts">
  import type { OptionItem } from './types'
  import OptionsEditDialog from './OptionsEditDialog.svelte'
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
    onDelete: () => void
    resolvedRandomValue?: OptionItem
  }

  let {
    id,
    label,
    value = $bindable(),
    placeholder,
    options,
    onValueChange,
    onOptionsChange,
    onDelete,
    resolvedRandomValue
  }: Props = $props()

  let showEditDialog = $state(false)
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

  function closeEditDialog() {
    showEditDialog = false
  }
</script>

<div class="input-group">
  <div class="label-container">
    <div class="label-with-drag">
      <div class="drag-handle" title="Drag to reorder">
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
      class="delete-button"
      onclick={onDelete}
      title="Remove category"
      aria-label="Remove category"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="3,6 5,6 21,6"></polyline>
        <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"
        ></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
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
    bind:value
    onClose={closeEditDialog}
    {onOptionsChange}
    {onValueChange}
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

  .delete-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .delete-button:hover {
    background: #fcc;
    border-color: #faa;
    color: #a11;
  }

  .delete-button:active {
    transform: scale(0.95);
  }
</style>
