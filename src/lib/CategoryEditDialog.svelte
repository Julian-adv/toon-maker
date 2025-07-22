<!-- Dialog component for editing category name and deleting category -->
<script lang="ts">
  import type { PromptCategory } from '$lib/types'
  
  interface Props {
    show: boolean
    category: PromptCategory
    allCategories: PromptCategory[]
    onClose: () => void
    onCategoryUpdate: (updatedCategory: PromptCategory) => void
    onCategoryDelete: (categoryId: string) => void
  }

  let { show, category, allCategories, onClose, onCategoryUpdate, onCategoryDelete }: Props = $props()

  let editedName = $state('')
  let selectedAliasId = $state('')

  // Update form values when dialog opens
  $effect(() => {
    if (show) {
      editedName = category.name
      selectedAliasId = category.aliasOf || ''
    }
  })

  // Get available categories for aliasing (excluding self and existing aliases)
  let availableCategories = $derived(
    allCategories.filter(cat => 
      cat.id !== category.id && !cat.aliasOf // Exclude self and categories that are already aliases
    )
  )

  function handleSave() {
    const trimmedName = editedName.trim()
    const hasChanges = trimmedName !== category.name || selectedAliasId !== (category.aliasOf || '')
    
    if (hasChanges && trimmedName) {
      const updatedCategory: PromptCategory = {
        ...category,
        name: trimmedName,
        aliasOf: selectedAliasId || undefined
      }
      onCategoryUpdate(updatedCategory)
    }
    onClose()
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`)) {
      onCategoryDelete(category.id)
      onClose()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSave()
    }
  }
</script>

{#if show}
  <div
    class="dialog-overlay"
    onclick={onClose}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="Close category edit dialog"
  >
    <div
      class="dialog"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-edit-title"
      tabindex="-1"
    >
      <div class="dialog-header">
        <h3 id="category-edit-title">Edit Category</h3>
        <button type="button" class="close-button" onclick={onClose} aria-label="Close dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="dialog-body">
        <div class="form-field">
          <label for="category-name">Category Name:</label>
          <input
            id="category-name"
            type="text"
            bind:value={editedName}
            placeholder="Enter category name"
          />
        </div>

        <div class="form-field">
          <label for="alias-select">Link to Category (Optional):</label>
          <select
            id="alias-select"
            bind:value={selectedAliasId}
          >
            <option value="">None - Use own options</option>
            {#each availableCategories as cat (cat.id)}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
          <p class="form-help">
            Link this category to another category to share its options. This category will act as an alias.
          </p>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="dialog-actions">
          <button
            type="button"
            class="delete-category-btn"
            onclick={handleDelete}
          >
            Delete
          </button>
          <div class="right-actions">
            <button type="button" class="dialog-cancel-btn" onclick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              class="dialog-save-btn" 
              onclick={handleSave}
              disabled={!editedName.trim() || (editedName.trim() === category.name && selectedAliasId === (category.aliasOf || ''))}
            >
              Save
            </button>
          </div>
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
    z-index: 10000;
    pointer-events: all;
  }

  .dialog {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 450px;
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
  }

  .form-field {
    margin-bottom: 2rem;
  }

  .form-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
    text-align: left;
  }

  .form-field input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }

  .form-field input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .form-field select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
    background: white;
  }

  .form-field select:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .form-help {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #666;
    line-height: 1.4;
  }

  .delete-category-btn {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .delete-category-btn:hover {
    background: #c82333;
  }

  .delete-category-btn:active {
    transform: scale(0.98);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    border-top: 1px solid #eee;
  }

  .dialog-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .right-actions {
    display: flex;
    gap: 0.5rem;
  }

  .dialog-cancel-btn {
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .dialog-cancel-btn:hover {
    background: #5a6268;
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

  .dialog-save-btn:hover:not(:disabled) {
    background: #1976d2;
  }

  .dialog-save-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
</style>