<script lang="ts">
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
</script>

<div class="input-group">
  <label for={id}>{label}</label>
  <select class="select-control" bind:value={selectedValue}>
    {#each options as option}
      <option value={option}>{option}</option>
    {/each}
  </select>
  <textarea {id} bind:value {placeholder} {rows}></textarea>
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
</style>
