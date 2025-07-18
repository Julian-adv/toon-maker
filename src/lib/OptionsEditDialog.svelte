<!-- Dialog component for editing options list -->
<script lang="ts">
  import type { OptionItem } from './types'
  import AutoCompleteTextarea from './AutoCompleteTextarea.svelte'
  import { savePromptsData } from './stores/promptsStore'
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
    value,
    onClose,
    onOptionsChange,
    onValueChange
  }: Props = $props()

  let selectedOption = $state<OptionItem>(value)
  let newOptionTitle = $state('')
  let newOptionValue = $state('')
  let optionsListElement = $state<HTMLDivElement | undefined>()



  // Update form values when dialog opens
  $effect(() => {
    if (show) {
      selectedOption = value
      newOptionTitle = ''
      newOptionValue = value.value || ''
      
      // Scroll to selected option after dialog opens
      setTimeout(() => {
        scrollToSelectedOption()
      }, 100)
    }
  })

  function scrollToSelectedOption() {
    if (!optionsListElement || !selectedOption.title) return
    
    const selectedButton = optionsListElement.querySelector('.option-item.selected') as HTMLElement
    if (selectedButton) {
      selectedButton.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }

  function handleOptionSelect(option: OptionItem) {
    // Auto-update current option before switching
    if (selectedOption.title && newOptionValue.trim() !== selectedOption.value) {
      handleUpdateOption()
    }
    
    // Use setTimeout to ensure state updates are completed first
    setTimeout(() => {
      selectedOption = option
      newOptionTitle = ''
      newOptionValue = option.value || ''
    }, 0)
  }

  function handleAddNewOption() {
    // Auto-update current option before adding new one
    if (selectedOption.title && newOptionValue.trim() !== selectedOption.value) {
      handleUpdateOption()
    }
    
    // Check if title already exists
    const titleExists = options.some(option => 
      option.title.toLowerCase() === newOptionTitle.trim().toLowerCase()
    )
    
    if (titleExists) {
      alert('This title already exists!')
      return
    }
    
    const newOption: OptionItem = {
      title: newOptionTitle.trim(),
      value: ''
    }
    
    const updatedOptions = [...options, newOption]
    onOptionsChange(updatedOptions)
    
    // Select the newly added option
    selectedOption = newOption
    onValueChange(newOption)
    
    // Clear the input fields
    newOptionTitle = ''
    newOptionValue = ''
  }

  function handleUpdateOption() {
    if (newOptionValue.trim()) {
      const updatedOptions = options.map(option => 
        option.title === selectedOption.title 
          ? { ...option, value: newOptionValue.trim() }
          : option
      )
      onOptionsChange(updatedOptions)
      selectedOption = { ...selectedOption, value: newOptionValue.trim() }
      onValueChange(selectedOption)
      newOptionValue = ''
    }
  }

  function handleDeleteOption() {
    const updatedOptions = options.filter((option) => option.title !== selectedOption.title)
    onOptionsChange(updatedOptions)

    // Select the closest remaining option
    if (updatedOptions.length > 0) {
      const currentIndex = options.findIndex((option) => option.title === selectedOption.title)
      let newIndex = currentIndex
      if (currentIndex >= updatedOptions.length) {
        newIndex = updatedOptions.length - 1
      }
      if (newIndex < 0) {
        newIndex = 0
      }
      selectedOption = updatedOptions[newIndex]
      onValueChange(selectedOption)
    } else {
      selectedOption = { title: '', value: '' }
      onValueChange(selectedOption)
    }
    newOptionTitle = ''
    newOptionValue = ''
  }

  async function handleSave() {
    // Auto-update current option before closing
    if (selectedOption.title && newOptionValue.trim() !== selectedOption.value) {
      handleUpdateOption()
    }
    
    onValueChange(selectedOption)
    
    // Save to prompts.json
    try {
      await savePromptsData()
    } catch (error) {
      console.error('Failed to save prompts:', error)
      alert('Failed to save prompts. Please try again.')
      return
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
        <div class="grid-container">
          <!-- Options List -->
          <div class="options-list" bind:this={optionsListElement}>
            {#each options as option (option.title)}
              <button 
                class="option-item" 
                class:selected={option.title === selectedOption.title}
                onclick={() => handleOptionSelect(option)}
              >
                {option.title}
              </button>
            {/each}
          </div>
          
          <!-- Selected Option Header -->
          <div class="selected-option-header">
            <h4>{selectedOption.title || 'No option selected'}</h4>
            <button 
              class="delete-option-btn" 
              onclick={handleDeleteOption}
              disabled={!selectedOption.title || options.length === 0}
              aria-label="Delete option"
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
          
          <!-- Option Value Textarea -->
          <div class="textarea-area">
            <AutoCompleteTextarea
              id="option-value"
              bind:value={newOptionValue}
              placeholder="Enter option value"
              rows={12}
            />
          </div>
          
          <!-- Left Controls -->
          <div class="left-controls">
            <input 
              type="text" 
              bind:value={newOptionTitle}
              placeholder="New option title"
              class="new-option-input"
            />
            <button 
              class="add-option-btn" 
              onclick={handleAddNewOption}
              disabled={!newOptionTitle.trim()}
            >
              Add
            </button>
          </div>
          
        </div>
      </div>
      <div class="dialog-footer">
        <div class="dialog-actions">
          <button type="button" class="dialog-close-btn" onclick={onClose}> Close </button>
          <button type="button" class="dialog-save-btn" onclick={handleSave}>
            Save
          </button>
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
    max-width: 800px;
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
    justify-content: flex-end;
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

  .grid-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    grid-template-rows: 1fr auto auto;
    gap: 1rem;
    height: 100%;
    grid-template-areas: 
      "options-list selected-header"
      "options-list textarea"
      "left-controls .";
  }

  .options-list {
    grid-area: options-list;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 350px;
  }

  .option-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: white;
    border: none;
    border-bottom: 1px solid #eee;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 0.875rem;
  }

  .option-item:hover {
    background: #f8f9fa;
  }

  .option-item.selected {
    background: #e3f2fd;
    color: #1976d2;
  }

  .option-item:last-child {
    border-bottom: none;
  }


  .new-option-input {
    flex: 2;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
    height: 36px;
    box-sizing: border-box;
  }

  .add-option-btn {
    padding: 0.5rem 1rem;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    height: 36px;
  }

  .add-option-btn:hover:not(:disabled) {
    background: #218838;
  }

  .add-option-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .selected-option-header {
    grid-area: selected-header;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .selected-option-header h4 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    text-align: left;
  }

  .delete-option-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .delete-option-btn:hover:not(:disabled) {
    background: #fcc;
    border-color: #faa;
    color: #a11;
  }

  .delete-option-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .textarea-area {
    grid-area: textarea;
    display: flex;
    flex-direction: column;
  }

  .textarea-area :global(textarea) {
    min-height: 300px !important;
    height: 300px !important;
    flex: 1;
    resize: vertical !important;
    overflow: auto !important;
  }

  .left-controls {
    grid-area: left-controls;
    display: flex;
    gap: 0.5rem;
    align-items: center;
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
