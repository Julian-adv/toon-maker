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
    rows: number
    options: OptionItem[]
    onValueChange: (value: OptionItem) => void
    onOptionsChange: (options: OptionItem[]) => void
  }

  let {
    id,
    label,
    value = $bindable(),
    placeholder,
    rows,
    options,
    onValueChange,
    onOptionsChange
  }: Props = $props()

  let showEditDialog = $state(false)

  function handleTextareaValueChange(newValue: string) {
    value.value = newValue
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
  <label for={id}>{label}</label>
  <div class="select-container">
    <ComboBox 
      bind:value 
      {options} 
      placeholder="Enter title..."
      {onValueChange}
    />
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
    bind:value={value.value}
    {placeholder}
    {rows}
    onValueChange={handleTextareaValueChange}
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
</style>
