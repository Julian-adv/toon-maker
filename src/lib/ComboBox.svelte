<!-- ComboBox component for filtering and selecting options -->
<script lang="ts">
  import type { OptionItem } from './types'

  interface Props {
    value: OptionItem
    options: OptionItem[]
    placeholder?: string
    onValueChange: (value: OptionItem) => void
    onOptionSelected?: (value: OptionItem) => void
  }

  let { value = $bindable(), options, placeholder = "Enter value...", onValueChange, onOptionSelected }: Props = $props()

  let showDropdown = $state(false)
  let filteredOptions = $state<OptionItem[]>([])
  let selectedIndex = $state(-1)
  let inputValue = $state(value.title)
  
  // Keep input value in sync with prop changes, but only when it's a significant change
  $effect(() => {
    // Only update if the prop value changed and we're not currently focused on input
    if (value.title !== inputValue && document.activeElement?.tagName !== 'INPUT') {
      inputValue = value.title
    }
  })

  function updateDropdown() {
    if (inputValue.length === 0) {
      filteredOptions = options
    } else {
      filteredOptions = options.filter(option => 
        option.title.toLowerCase().includes(inputValue.toLowerCase())
      )
    }
    showDropdown = filteredOptions.length > 0
    selectedIndex = -1
  }

  function selectOption(option: OptionItem) {
    value = { ...option }
    inputValue = option.title
    showDropdown = false
    onValueChange(value)
    onOptionSelected?.(value)
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    inputValue = target.value
    updateDropdown()
    // Update the value object with the new input
    value = { ...value, title: inputValue }
    onValueChange(value)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!showDropdown) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        selectedIndex = Math.max(selectedIndex - 1, -1)
        break
      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0) {
          event.preventDefault()
          selectOption(filteredOptions[selectedIndex])
        }
        break
      case 'Escape':
        showDropdown = false
        selectedIndex = -1
        break
    }
  }

  function handleFocus() {
    // Show all options on first focus, without filtering
    filteredOptions = options
    showDropdown = options.length > 0
    selectedIndex = -1
  }

  function handleClick() {
    // Show all options when clicked, even if already focused
    filteredOptions = options
    showDropdown = options.length > 0
    selectedIndex = -1
  }

  function handleBlur() {
    // Use setTimeout to allow option clicks to be processed before hiding
    setTimeout(() => {
      showDropdown = false
      selectedIndex = -1
    }, 150)
  }
</script>

<div class="combobox-container">
  <input
    type="text"
    class="combobox-input"
    value={inputValue}
    {placeholder}
    oninput={handleInput}
    onkeydown={handleKeydown}
    onfocus={handleFocus}
    onclick={handleClick}
    onblur={handleBlur}
  />
  
  <div class="combobox-arrow">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  
  {#if showDropdown}
    <div class="combobox-dropdown">
      {#each filteredOptions as option, index (option.title)}
        <button
          type="button"
          class="combobox-option {index === selectedIndex ? 'selected' : ''}"
          onmousedown={(e) => {
            e.preventDefault()
            selectOption(option)
          }}
        >
          {option.title.substring(0, 180)}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .combobox-container {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .combobox-input {
    width: 100%;
    padding: 5px 30px 5px 10px; /* Add right padding for arrow */
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    background-color: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .combobox-input:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  .combobox-arrow {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    pointer-events: none;
    color: #666;
    transition: transform 0.2s ease;
  }

  .combobox-container:focus-within .combobox-arrow {
    transform: translateY(-50%) rotate(180deg);
  }

  .combobox-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 2px;
  }

  .combobox-option {
    display: block;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    transition: background-color 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .combobox-option:hover {
    background-color: #f5f5f5;
  }

  .combobox-option.selected {
    background-color: #e8f4fd;
    color: #1976d2;
  }
</style>