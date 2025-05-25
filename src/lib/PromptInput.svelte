<script lang="ts">
  let promptValue: string = $state('')

  function handleSubmit() {
    // Dispatch an event or call a function with the promptValue
    console.log('Prompt submitted:', promptValue)
    // You can replace this with an event dispatch, e.g.:
    // import { createEventDispatcher } from 'svelte';
    // const dispatch = createEventDispatcher();
    // dispatch('submit', { prompt: promptValue });
    promptValue = '' // Clear the input after submission
  }
</script>

<div class="prompt-container">
  <textarea
    bind:value={promptValue}
    placeholder="Enter your prompt..."
    rows="3"
    class="focus:outline-blue-500"
  ></textarea>
  <button onclick={handleSubmit}>Generate</button>
</div>

<style>
  .prompt-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    max-width: 1000px;
    width: 100%;
    margin: 20px auto;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 16px;
    resize: vertical; /* Allow vertical resizing, disable horizontal */
    box-sizing: border-box; /* Ensure padding and border are included in the element's total width and height */
    background-color: #fff;
  }

  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    align-self: flex-end; /* Align button to the right */
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
