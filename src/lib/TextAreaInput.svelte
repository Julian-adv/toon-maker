<script lang="ts">
  let {
    id,
    label,
    value = $bindable(),
    placeholder,
    rows
  }: { id: string; label: string; value: string; placeholder: string; rows: number } = $props()
</script>

<div class="input-group">
  <label for={id}>{label}</label>
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
