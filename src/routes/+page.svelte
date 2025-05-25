<script lang="ts">
  import PromptInput from '$lib/PromptInput.svelte'
</script>

<svelte:head>
  <title>Toon Maker</title>
  <meta name="description" content="Toon Maker" />
</svelte:head>

<section>
  <h1>Toon Maker</h1>
  <PromptInput />
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh; /* Make section take at least 80% of viewport height */
    text-align: center;
  }

  h1 {
    color: #333;
    margin-bottom: 2rem; /* Add some space below the title */
  }
</style>
