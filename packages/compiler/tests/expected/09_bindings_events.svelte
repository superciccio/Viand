<script lang="ts">
  let text: string = $state("");

  function handleSubmit() {
    text = "Submitted";
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <input bind:value={text} placeholder="Type here" />
  <button>
    Submit
  </button>
  <button onclick={handleSubmit}>
    Explicit Click
  </button>
  <button onclick={handleSubmit}>
    Shorthand Click
  </button>
</form>
