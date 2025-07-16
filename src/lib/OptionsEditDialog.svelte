<!-- Dialog component for editing options list -->
<script lang="ts">
  import type { OptionItem } from './types'
  import ComboBox from './ComboBox.svelte'
  interface Props {
    show: boolean
    label: string
    options: OptionItem[]
    value: OptionItem
    onClose: () => void
    onOptionsChange: (options: OptionItem[]) => void
    onValueChange: (value: OptionItem) => void
  }

  let {
    show,
    label,
    options,
    value = $bindable(),
    onClose,
    onOptionsChange,
    onValueChange
  }: Props = $props()

  let newOptionTitle = $state(value.title)
  let newOptionValue = $state(value.value)
  let titleComboValue = $state<OptionItem>({ title: value.title || '', value: value.title || '' })
  
  // Original values to compare against
  let originalTitle = $state(value.title)
  let originalValue = $state(value.value)

  // Determine save button label based on changes
  let saveButtonLabel = $derived.by(() => {
    const titleChanged = newOptionTitle !== originalTitle
    const valueChanged = newOptionValue !== originalValue
    
    if (titleChanged) {
      return 'Add'
    } else if (valueChanged) {
      return 'Update'
    } else {
      return 'Save'
    }
  })

  // Update form values when dialog opens
  $effect(() => {
    if (show) {
      originalTitle = value.title || ''
      originalValue = value.value || ''
      newOptionTitle = value.title || ''
      newOptionValue = value.value || ''
      titleComboValue = { title: value.title || '', value: value.title || '' }
    }
  })

  function handleTitleComboChange(newValue: OptionItem) {
    titleComboValue = newValue
    newOptionTitle = newValue.title
    newOptionValue = newValue.value
  }

  function handleOptionSelected(selectedValue: OptionItem) {
    // Reset original values only when user selects from dropdown list
    originalTitle = selectedValue.title
    originalValue = selectedValue.value
  }

  function handleDeleteCurrentValue() {
    const updatedOptions = options.filter((option) => option.title !== value.title)
    onOptionsChange(updatedOptions)

    // Select the closest remaining option
    if (updatedOptions.length > 0) {
      const currentIndex = options.findIndex((option) => option.title === value.title)
      let newIndex = currentIndex
      if (currentIndex >= updatedOptions.length) {
        newIndex = updatedOptions.length - 1
      }
      if (newIndex < 0) {
        newIndex = 0
      }
      value = updatedOptions[newIndex]
      onValueChange(value)
    } else {
      value.title = ''
      value.value = ''
      onValueChange(value)
    }
  }

  function handleSave() {
    if (newOptionValue.trim()) {
      const newOption: OptionItem = {
        title: newOptionTitle.trim() || newOptionValue.trim(),
        value: newOptionValue.trim()
      }
      const updatedOptions = [...options, newOption]
      onOptionsChange(updatedOptions)
      newOptionTitle = ''
      newOptionValue = ''
    }
    onClose()
  }
</script>

{#if show}
  <div
    class="dialog-overlay"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="dialog"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
    >
      <div class="dialog-header">
        <h3>Edit {label} Option</h3>
        <button type="button" class="close-button" onclick={onClose} aria-label="Close dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <div class="form-section">
          <div>
            <label for="option-title">Title:</label>
            <ComboBox
              bind:value={titleComboValue}
              {options}
              placeholder="Enter option title"
              onValueChange={handleTitleComboChange}
              onOptionSelected={handleOptionSelected}
            />
          </div>
          <div>
            <label for="option-value">Value:</label>
            <textarea
              id="option-value"
              bind:value={newOptionValue}
              placeholder="Enter option value"
              class="form-input"
              rows="6"
            ></textarea>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button
          type="button"
          class="delete-current-btn"
          onclick={handleDeleteCurrentValue}
          disabled={!value.value || options.length === 0}
        >
          Delete
        </button>
        <div class="dialog-actions">
          <button type="button" class="dialog-close-btn" onclick={onClose}> Close </button>
          <button type="button" class="dialog-save-btn" onclick={handleSave}> {saveButtonLabel} </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: #666;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: #f0f0f0;
    color: #333;
  }

  .dialog-body {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    border-top: 1px solid #eee;
  }

  .dialog-close-btn {
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .dialog-close-btn:hover {
    background: #5a6268;
  }

  .delete-current-btn {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .delete-current-btn:hover:not(:disabled) {
    background: #c82333;
  }

  .delete-current-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-section label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
    text-align: left;
  }

  .form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .form-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
  }

  .dialog-save-btn {
    padding: 0.5rem 1rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .dialog-save-btn:hover {
    background: #1976d2;
  }
</style>
