<script lang="ts">
  let text: string = $state("");

  function handleSubmit() {
    text = "Submitted";
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={text} placeholder="Type here" />
  <button>
    Submit
  </button>
  <button on:click={handleSubmit}>
    Explicit Click
  </button>
  <button on:click={handleSubmit}>
    Shorthand Click
  </button>
</form>