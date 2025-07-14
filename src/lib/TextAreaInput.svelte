<script lang="ts">
  import { onMount } from 'svelte'

  let {
    id,
    label,
    value = $bindable(),
    placeholder,
    rows,
    options = [],
    selectedValue = $bindable()
  }: {
    id: string
    label: string
    value: string
    placeholder: string
    rows: number
    options: string[]
    selectedValue: string
  } = $props()

  let textareaElement: HTMLTextAreaElement
  let tags: string[] = $state([])
  let suggestions: string[] = $state([])
  let showSuggestions = $state(false)
  let selectedSuggestionIndex = $state(-1)
  let suggestionPosition = $state({ top: 0, left: 0 })
  let mirrorDiv: HTMLDivElement | null = null

  onMount(async () => {
    try {
      const response = await fetch('/api/tags')
      tags = await response.json()
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  })

  $effect(() => {
    if (selectedValue) {
      value = selectedValue
    }
  })

  function getCurrentWord(): { word: string; startIndex: number } {
    const cursorPosition = textareaElement.selectionStart
    const text = value

    // Find the start of the current word (looking for spaces or commas)
    let startIndex = cursorPosition - 1
    while (
      startIndex >= 0 &&
      text[startIndex] !== ' ' &&
      text[startIndex] !== ',' &&
      text[startIndex] !== '\n'
    ) {
      startIndex--
    }
    startIndex++

    // Find the end of the current word
    let endIndex = cursorPosition
    while (
      endIndex < text.length &&
      text[endIndex] !== ' ' &&
      text[endIndex] !== ',' &&
      text[endIndex] !== '\n'
    ) {
      endIndex++
    }

    return {
      word: text.substring(startIndex, endIndex).trim(),
      startIndex
    }
  }

  function updateSuggestions() {
    const { word } = getCurrentWord()

    if (word.length < 2) {
      suggestions = []
      showSuggestions = false
      return
    }

    suggestions = tags.filter((tag) => tag.toLowerCase().includes(word.toLowerCase())).slice(0, 100)

    showSuggestions = suggestions.length > 0
    selectedSuggestionIndex = -1

    if (showSuggestions) {
      updateSuggestionPosition()
    }
  }

  function updateSuggestionPosition() {
    // Use textarea mirroring technique directly (selection API doesn't work reliably for textarea caret position)
    let popUpPos = { x: 0, y: 0 }

    // Create and setup mirror div if it doesn't exist
    if (!mirrorDiv) {
      mirrorDiv = document.createElement('div')
      document.body.appendChild(mirrorDiv)

      const style = window.getComputedStyle(textareaElement)

      // Copy all computed styles from textarea to mirror div
      for (let i = 0; i < style.length; i++) {
        const property = style[i]
        mirrorDiv.style.setProperty(property, style.getPropertyValue(property))
      }

      // Set position styles for accurate positioning
      mirrorDiv.style.visibility = 'hidden'
    }

    // Clear previous content
    mirrorDiv.innerHTML = ''

    // Add text up to cursor position
    const textBeforeCursor = textareaElement.value.substring(0, textareaElement.selectionStart)
    const textAfterCursor = textareaElement.value.substring(textareaElement.selectionStart)

    mirrorDiv.textContent = textBeforeCursor

    // Add a span at cursor position
    const span = document.createElement('span')
    mirrorDiv.appendChild(span)

    // Add remaining text after cursor for accurate wrapping
    const afterText = document.createTextNode(textAfterCursor)
    mirrorDiv.appendChild(afterText)

    // Get positions
    const divPos = mirrorDiv.getBoundingClientRect()
    const spanPos = span.getBoundingClientRect()
    const inputPos = textareaElement.getBoundingClientRect()

    popUpPos = {
      x: inputPos.x + (spanPos.x - divPos.x),
      y: inputPos.y + (spanPos.y - divPos.y)
    }

    suggestionPosition = {
      top: popUpPos.y - textareaElement.getBoundingClientRect().y + 20 - textareaElement.scrollTop, // Relative to textarea accounting for scroll
      left: popUpPos.x - textareaElement.getBoundingClientRect().x - textareaElement.scrollLeft
    }
  }

  function insertSuggestion(suggestion: string) {
    const { word, startIndex } = getCurrentWord()
    const beforeWord = value.substring(0, startIndex)
    const afterWord = value.substring(startIndex + word.length)

    value = beforeWord + suggestion + afterWord
    showSuggestions = false

    // Set cursor position after the inserted suggestion
    setTimeout(() => {
      const newCursorPosition = startIndex + suggestion.length
      textareaElement.setSelectionRange(newCursorPosition, newCursorPosition)
      textareaElement.focus()
    }, 0)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!showSuggestions) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1)
        break
      case 'Enter':
      case 'Tab':
        if (selectedSuggestionIndex >= 0) {
          event.preventDefault()
          insertSuggestion(suggestions[selectedSuggestionIndex])
        } else if (suggestions.length > 0) {
          event.preventDefault()
          insertSuggestion(suggestions[0])
        }
        break
      case 'Escape':
        showSuggestions = false
        selectedSuggestionIndex = -1
        break
    }
  }

  function handleInput() {
    updateSuggestions()
  }

  function handleClick() {
    updateSuggestions()
  }

  function handleBlur() {
    // Use setTimeout to allow suggestion clicks to be processed before hiding
    setTimeout(() => {
      showSuggestions = false
      selectedSuggestionIndex = -1
    }, 150)
  }
</script>

<div class="input-group">
  <label for={id}>{label}</label>
  <select class="select-control" bind:value={selectedValue}>
    {#each options as option (option)}
      <option value={option}>{option.substring(0, 180)}</option>
    {/each}
  </select>
  <div class="textarea-container">
    <textarea
      {id}
      bind:this={textareaElement}
      bind:value
      {placeholder}
      {rows}
      oninput={handleInput}
      onclick={handleClick}
      onkeydown={handleKeydown}
      onblur={handleBlur}
    ></textarea>

    {#if showSuggestions}
      <div
        class="suggestions-dropdown"
        style="top: {suggestionPosition.top}px; left: {suggestionPosition.left}px;"
      >
        {#each suggestions as suggestion, index (suggestion)}
          <button
            type="button"
            class="suggestion-item {index === selectedSuggestionIndex ? 'selected' : ''}"
            onmousedown={(e) => {
              e.preventDefault()
              insertSuggestion(suggestion)
            }}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
  </div>
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

  .select-control {
    width: 100%;
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    background-color: #fff;
    box-sizing: border-box;
  }

  .textarea-container {
    position: relative;
    width: 100%;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
    background-color: #fff;
  }

  .suggestions-dropdown {
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 1000;
    min-width: 150px;
  }

  .suggestion-item {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    color: #2c6ded;
    border-radius: 4px;
    margin: 2px 4px;
    transition: background-color 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }

  .suggestion-item:hover {
    background-color: #f5f5f5;
  }

  .suggestion-item.selected {
    background-color: #e8f4fd;
    color: #1976d2;
  }
</style>
